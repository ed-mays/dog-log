/**
 * Orchestrator round 1.
 *
 * Chains build → review → arbitrate → apply → rebuild loops with explicit
 * halt policies. Stateless within a single orchestrateTask call, but logs
 * every dispatch + amendment to .harness/state.json for audit.
 *
 * v1 scope:
 *   - Build success → cold-reader → approve = done; veto routes by scope_check
 *   - Cold-reader veto on scope_check 1, 2 (builder error) → halt for human.
 *     Re-dispatching builder with veto context isn't supported in v1
 *     (would require extending dispatchBuilder to accept extra context).
 *   - Cold-reader veto on scope_check 3, 4, 5, 6 (spec/design ambiguity) →
 *     escalate to arbiter; apply amendment via deterministic before/after
 *     substitution; re-dispatch builder; re-review.
 *   - Builder spec_gap → escalate to arbiter directly.
 *   - Arbiter pushback → re-dispatch builder (clarification appended via the
 *     arbiter prompt's `pushback_clarification`; v1 does not feed this back
 *     into the builder input — same limit as scope-1/2 veto).
 *   - Caps: 2 builder retries, 2 arbiter amendments per task, $5 / 30 min.
 *   - On any cap, halt for human with full state + summary.
 */

import {
  dispatchBuilder,
  type BuilderDispatchResult,
  type BuilderExit,
} from './dispatch/builder-dispatch';
import {
  dispatchColdReader,
  type ColdReaderDispatchResult,
  type ColdReaderExit,
  type ColdReaderFinding,
} from './dispatch/cold-reader-dispatch';
import {
  dispatchArbiter,
  type ArbiterDispatchResult,
  type ArbiterExit,
} from './dispatch/arbiter-dispatch';
import { applyAmendment } from './dispatch/apply-amendment';
import type { SpecGapPayload } from './drift-arbiter-input';
import {
  appendEvent,
  defaultStatePath,
  initState,
  loadState,
  summarizeRun,
  type OrchestratorState,
} from './state-store';
import { execSync } from 'node:child_process';

export type OrchestrateOutcome =
  | 'success'
  | 'halt_builder_error_veto'
  | 'halt_builder_spec_gap_unresolved'
  | 'halt_verify_fail'
  | 'halt_budget_exceeded'
  | 'halt_amendment_apply_failed'
  | 'halt_retry_cap'
  | 'halt_amendment_cap'
  | 'halt_cost_cap'
  | 'halt_pushback_unsupported';

export interface OrchestrateOptions {
  taskId: string;
  /** Override state path (default: .harness/state.json under cwd). */
  statePath?: string;
  /** Override spec/task list paths. */
  taskListPath?: string;
  /** Working directory. */
  cwd?: string;
  /** Cap: max total cost across all dispatches (USD). Default $5. */
  maxCostUsd?: number;
  /** Cap: max builder dispatches per task (initial + retries). Default 3. */
  maxBuilderDispatches?: number;
  /** Cap: max arbiter dispatches per task. Default 2. */
  maxArbiterDispatches?: number;
  /** Inject dispatchers + applier for tests. */
  deps?: OrchestrateDeps;
}

export interface OrchestrateDeps {
  dispatchBuilder: typeof dispatchBuilder;
  dispatchColdReader: typeof dispatchColdReader;
  dispatchArbiter: typeof dispatchArbiter;
  applyAmendment: typeof applyAmendment;
  /** Returns the SHA of the most recent commit on HEAD (for cold-reader diff range). */
  resolveHeadSha: () => string;
}

export interface OrchestrateResult {
  outcome: OrchestrateOutcome;
  builderDispatches: number;
  arbiterDispatches: number;
  totalCostUsd: number;
  state: OrchestratorState;
  /** Last-known commit SHA produced by builder (when one exists). */
  lastCommitSha?: string;
  /** Reason text for halts (operator-readable). */
  haltReason?: string;
}

const DEFAULT_DEPS: OrchestrateDeps = {
  dispatchBuilder,
  dispatchColdReader,
  dispatchArbiter,
  applyAmendment,
  resolveHeadSha: () =>
    execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
};

export async function orchestrateTask(
  opts: OrchestrateOptions
): Promise<OrchestrateResult> {
  const deps = opts.deps ?? DEFAULT_DEPS;
  const statePath = opts.statePath ?? defaultStatePath(opts.cwd);
  const maxCostUsd = opts.maxCostUsd ?? 5;
  const maxBuilderDispatches = opts.maxBuilderDispatches ?? 3;
  const maxArbiterDispatches = opts.maxArbiterDispatches ?? 2;

  initState(opts.taskId, statePath);
  appendEvent(statePath, {
    task_id: opts.taskId,
    type: 'orchestrate_start',
    payload: {
      caps: { maxCostUsd, maxBuilderDispatches, maxArbiterDispatches },
    },
  });

  let builderDispatches = 0;
  let arbiterDispatches = 0;
  let totalCostUsd = 0;
  let lastCommitSha: string | undefined;

  function tally(cost: number): void {
    totalCostUsd += cost;
  }

  function exceedsCost(): boolean {
    return totalCostUsd >= maxCostUsd;
  }

  // Loop guard: each iteration is one builder dispatch + (possibly) follow-ups.
  while (true) {
    if (builderDispatches >= maxBuilderDispatches) {
      return halt(
        'halt_retry_cap',
        `builder dispatch cap reached (${maxBuilderDispatches})`
      );
    }
    if (exceedsCost()) {
      return halt(
        'halt_cost_cap',
        `total cost cap reached ($${totalCostUsd.toFixed(2)} >= $${maxCostUsd})`
      );
    }

    // ─── BUILDER ──────────────────────────────────────────────────────────
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'dispatch_start',
      payload: { role: 'builder', attempt: builderDispatches + 1 },
    });
    const buildResult = await deps.dispatchBuilder({
      taskId: opts.taskId,
      taskListPath: opts.taskListPath,
      cwd: opts.cwd,
    });
    builderDispatches += 1;
    tally(buildResult.raw.costUsd);
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'dispatch_end',
      payload: dispatchEndPayload('builder', buildResult),
    });

    if (!buildResult.exit) {
      return halt(
        'halt_verify_fail',
        `builder parse_error: ${buildResult.parseError ?? 'unknown'}`
      );
    }

    if (buildResult.exit.status === 'verify_fail') {
      return halt('halt_verify_fail', 'builder reported verify_fail');
    }
    if (buildResult.exit.status === 'budget_exceeded') {
      return halt('halt_budget_exceeded', 'builder hit per-dispatch budget');
    }
    if (buildResult.exit.status === 'spec_gap') {
      // Skip cold-reader; go straight to arbiter.
      const gap: SpecGapPayload = {
        task_id: opts.taskId,
        cited_section: buildResult.exit.cited_section ?? 'unknown',
        gap_description: buildResult.exit.gap_description ?? '(no description)',
        suggested_amendment: buildResult.exit.suggested_amendment,
        files_inspected: buildResult.exit.files_inspected,
      };
      const arbResult = await runArbiterCycle(gap);
      if (arbResult.outcome !== 'continue') return arbResult.result!;
      continue;
    }

    // status === 'success'
    // Per finding #9 (round 38, T-20): builder's reported commit_sha is a
    // free-text string the model invents; first 7 chars usually match the
    // real short SHA but the remaining 33 chars are sometimes invented. Trust
    // git instead — the builder commits then exits, so HEAD IS the produced
    // commit at this point.
    try {
      lastCommitSha = deps.resolveHeadSha();
    } catch (err) {
      return halt(
        'halt_verify_fail',
        `failed to resolve HEAD sha after builder dispatch: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (!lastCommitSha) {
      return halt(
        'halt_verify_fail',
        'git rev-parse HEAD returned empty after builder dispatch'
      );
    }

    // ─── COLD-READER ──────────────────────────────────────────────────────
    if (exceedsCost()) {
      return halt(
        'halt_cost_cap',
        `total cost cap reached after build ($${totalCostUsd.toFixed(2)})`
      );
    }
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'dispatch_start',
      payload: { role: 'cold-reader', attempt: 1, diff_sha: lastCommitSha },
    });
    const reviewResult = await deps.dispatchColdReader({
      taskId: opts.taskId,
      taskListPath: opts.taskListPath,
      cwd: opts.cwd,
      diffRange: `${lastCommitSha}~1..${lastCommitSha}`,
    });
    tally(reviewResult.raw.costUsd);
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'dispatch_end',
      payload: dispatchEndPayload('cold-reader', reviewResult),
    });

    if (!reviewResult.exit) {
      return halt(
        'halt_verify_fail',
        `cold-reader parse_error: ${reviewResult.parseError ?? 'unknown'}`
      );
    }
    if (reviewResult.exit.verdict === 'approve') {
      // 🎉 happy path
      return success(
        lastCommitSha,
        builderDispatches,
        arbiterDispatches,
        totalCostUsd
      );
    }

    // verdict === 'veto'
    const blockingFinding = pickBlockingFinding(reviewResult.exit);
    if (!blockingFinding) {
      return halt(
        'halt_verify_fail',
        'cold-reader veto with no parseable finding to route on'
      );
    }
    if (
      blockingFinding.scope_check === 1 ||
      blockingFinding.scope_check === 2
    ) {
      return halt(
        'halt_builder_error_veto',
        `cold-reader veto rooted in builder error (scope_check ${blockingFinding.scope_check}: ${blockingFinding.cited_section}). v1 does not auto-retry builder with veto context; human re-dispatches with context or amends task.`
      );
    }
    // scope_check 3, 4, 5, 6 → arbiter
    const gap: SpecGapPayload = {
      task_id: opts.taskId,
      cited_section: blockingFinding.cited_section,
      gap_description: `Cold-reader veto (${blockingFinding.severity} #${blockingFinding.scope_check}, cite ${blockingFinding.cited_section}): ${blockingFinding.description}`,
      suggested_amendment: undefined,
      files_inspected: undefined,
    };
    const arbResult = await runArbiterCycle(gap);
    if (arbResult.outcome !== 'continue') return arbResult.result!;
    // continue → loop back to builder
  }

  // ─── helpers ───────────────────────────────────────────────────────────
  async function runArbiterCycle(
    gap: SpecGapPayload
  ): Promise<{ outcome: 'continue' | 'halt'; result?: OrchestrateResult }> {
    if (arbiterDispatches >= maxArbiterDispatches) {
      return {
        outcome: 'halt',
        result: halt(
          'halt_amendment_cap',
          `arbiter dispatch cap reached (${maxArbiterDispatches})`
        ),
      };
    }
    if (exceedsCost()) {
      return {
        outcome: 'halt',
        result: halt(
          'halt_cost_cap',
          `total cost cap reached before arbiter ($${totalCostUsd.toFixed(2)})`
        ),
      };
    }
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'dispatch_start',
      payload: { role: 'arbiter', attempt: arbiterDispatches + 1 },
    });
    const arbResult = await deps.dispatchArbiter({
      specGap: gap,
      taskListPath: opts.taskListPath,
      cwd: opts.cwd,
    });
    arbiterDispatches += 1;
    tally(arbResult.raw.costUsd);
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'dispatch_end',
      payload: dispatchEndPayload('arbiter', arbResult),
    });

    if (!arbResult.exit) {
      return {
        outcome: 'halt',
        result: halt(
          'halt_verify_fail',
          `arbiter parse_error: ${arbResult.parseError ?? 'unknown'}`
        ),
      };
    }

    if (arbResult.exit.verdict === 'pushback') {
      return {
        outcome: 'halt',
        result: halt(
          'halt_pushback_unsupported',
          `arbiter pushback: "${arbResult.exit.pushback_clarification ?? '(no clarification)'}". v1 does not feed pushback into the builder input; human re-dispatches with context.`
        ),
      };
    }

    // amend_*  → apply, then continue (re-dispatch builder)
    if (!arbResult.exit.amendment) {
      return {
        outcome: 'halt',
        result: halt(
          'halt_verify_fail',
          'arbiter verdict was amend_* but no amendment payload present'
        ),
      };
    }
    const applyResult = deps.applyAmendment(arbResult.exit.amendment, {
      repoRoot: opts.cwd,
    });
    if (!applyResult.ok) {
      appendEvent(statePath, {
        task_id: opts.taskId,
        type: 'amendment_apply_failed',
        payload: {
          error: applyResult.error,
          amendment: arbResult.exit.amendment,
        },
      });
      return {
        outcome: 'halt',
        result: halt(
          'halt_amendment_apply_failed',
          `apply-amendment failed: ${applyResult.error}`
        ),
      };
    }
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'amendment_applied',
      payload: {
        file: arbResult.exit.amendment.file,
        anchor: arbResult.exit.amendment.anchor,
        changelog_appended_at_eof: applyResult.changelog_appended_at_eof,
      },
    });
    return { outcome: 'continue' };
  }

  function halt(
    outcome: OrchestrateOutcome,
    haltReason: string
  ): OrchestrateResult {
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'cycle_halt',
      payload: { reason: outcome, message: haltReason },
    });
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'orchestrate_end',
      payload: { outcome, totalCostUsd, builderDispatches, arbiterDispatches },
    });
    const state = loadState(statePath)!;
    return {
      outcome,
      builderDispatches,
      arbiterDispatches,
      totalCostUsd,
      state,
      lastCommitSha,
      haltReason,
    };
  }

  function success(
    commitSha: string,
    bDispatches: number,
    aDispatches: number,
    cost: number
  ): OrchestrateResult {
    appendEvent(statePath, {
      task_id: opts.taskId,
      type: 'orchestrate_end',
      payload: {
        outcome: 'success',
        commit_sha: commitSha,
        totalCostUsd: cost,
        builderDispatches: bDispatches,
        arbiterDispatches: aDispatches,
      },
    });
    const state = loadState(statePath)!;
    return {
      outcome: 'success',
      builderDispatches: bDispatches,
      arbiterDispatches: aDispatches,
      totalCostUsd: cost,
      state,
      lastCommitSha: commitSha,
    };
  }
}

function pickBlockingFinding(exit: ColdReaderExit): ColdReaderFinding | null {
  // Pick the highest-severity finding (CRITICAL > HIGH); ignore MEDIUM/LOW
  // since they don't gate per the cold-reader contract.
  const blocking = exit.findings.filter(
    (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH'
  );
  if (blocking.length === 0) return null;
  blocking.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  return blocking[0]!;
}

function severityRank(s: string): number {
  return s === 'CRITICAL' ? 4 : s === 'HIGH' ? 3 : s === 'MEDIUM' ? 2 : 1;
}

function dispatchEndPayload(
  role: 'builder' | 'cold-reader' | 'arbiter',
  result:
    | BuilderDispatchResult
    | ColdReaderDispatchResult
    | ArbiterDispatchResult
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    role,
    cost_usd: result.raw.costUsd,
    duration_ms: result.raw.durationMs,
    num_turns: result.raw.numTurns,
    session_id: result.raw.sessionId,
    stop_reason: result.raw.stopReason,
  };
  if (result.parseError) {
    base.parse_error = result.parseError;
    // Preserve raw text on parse failure so debugging doesn't require a
    // re-dispatch (round-34 finding: orchestrator halted on cold-reader
    // parse error but raw text was lost; manual re-dispatch was needed
    // to see the actual response).
    base.raw_result_text = result.raw.resultText;
  }
  if ('exit' in result && result.exit) {
    if (role === 'builder') {
      const e = result.exit as BuilderExit;
      base.status = e.status;
      if (e.status === 'success') base.commit_sha = e.commit_sha;
    }
    if (role === 'cold-reader') {
      const e = result.exit as ColdReaderExit;
      base.verdict = e.verdict;
      base.findings_count = e.findings.length;
      // Per finding #10 (round 39, T-22): on veto, operator otherwise needs
      // to re-dispatch ($0.25-0.35) just to read the finding text. Capture
      // the full findings array so state.json is sufficient for diagnosis.
      base.findings = e.findings;
    }
    if (role === 'arbiter') {
      const e = result.exit as ArbiterExit;
      base.verdict = e.verdict;
    }
  }
  return base;
}

export function summarizeOrchestrateResult(result: OrchestrateResult): string {
  const summary = summarizeRun(result.state);
  const lines = [
    `outcome: ${result.outcome}`,
    `cost: $${result.totalCostUsd.toFixed(4)}`,
    `dispatches: builder=${result.builderDispatches}, arbiter=${result.arbiterDispatches}, total events=${result.state.events.length}`,
    `amendments applied: ${summary.amendmentCount}`,
  ];
  if (result.lastCommitSha) {
    lines.push(`last commit: ${result.lastCommitSha}`);
  }
  if (result.haltReason) {
    lines.push(`halt reason: ${result.haltReason}`);
  }
  return lines.join('\n');
}

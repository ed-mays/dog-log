import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { orchestrateTask, type OrchestrateDeps } from './orchestrate';
import type {
  BuilderDispatchResult,
  BuilderExit,
} from './dispatch/builder-dispatch';
import type {
  ColdReaderDispatchResult,
  ColdReaderExit,
} from './dispatch/cold-reader-dispatch';
import type {
  ArbiterDispatchResult,
  ArbiterExit,
} from './dispatch/arbiter-dispatch';
import type { ApplyAmendmentResult } from './dispatch/apply-amendment';
import type { DispatchResult } from './subagent-dispatch';

let workDir: string;
let statePath: string;
let specDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'orchestrate-'));
  statePath = join(workDir, '.harness/state.json');
  specDir = join(workDir, 'docs/specs/incident-capture');
  mkdirSync(specDir, { recursive: true });
  writeFileSync(join(specDir, '02-design.md'), '# Design\n', 'utf8');
});

function rawEnvelope(costUsd: number, durationMs = 1000): DispatchResult {
  return {
    resultText: '<mocked>',
    isError: false,
    costUsd,
    durationMs,
    numTurns: 5,
    sessionId: `session-${Math.random().toString(36).slice(2, 8)}`,
    stopReason: 'end_turn',
    rawEnvelope: {},
  };
}

function builderSuccess(
  commitSha: string,
  costUsd = 0.5
): BuilderDispatchResult {
  return {
    exit: { status: 'success', commit_sha: commitSha } as BuilderExit,
    raw: rawEnvelope(costUsd),
  };
}
function builderSpecGap(
  cite: string,
  desc: string,
  costUsd = 0.6
): BuilderDispatchResult {
  return {
    exit: {
      status: 'spec_gap',
      cited_section: cite,
      gap_description: desc,
    } as BuilderExit,
    raw: rawEnvelope(costUsd),
  };
}
function builderVerifyFail(costUsd = 0.7): BuilderDispatchResult {
  return {
    exit: {
      status: 'verify_fail',
      verify_command: 'pnpm exec vitest',
      attempts: 3,
    } as BuilderExit,
    raw: rawEnvelope(costUsd),
  };
}
function reviewApprove(costUsd = 0.27): ColdReaderDispatchResult {
  return {
    exit: {
      task_id: 'T-N',
      verdict: 'approve',
      findings: [],
    } as ColdReaderExit,
    raw: rawEnvelope(costUsd),
  };
}
function reviewVeto(
  scopeCheck: 1 | 2 | 3 | 4 | 5 | 6,
  cite: string,
  costUsd = 0.27
): ColdReaderDispatchResult {
  return {
    exit: {
      task_id: 'T-N',
      verdict: 'veto',
      findings: [
        {
          severity: 'HIGH',
          scope_check: scopeCheck,
          cited_section: cite,
          evidence: 'fake-file:1',
          description: `mock veto on scope ${scopeCheck}`,
        },
      ],
    } as ColdReaderExit,
    raw: rawEnvelope(costUsd),
  };
}
function arbiterAmendDesign(
  before: string,
  after: string,
  costUsd = 0.3
): ArbiterDispatchResult {
  return {
    exit: {
      verdict: 'amend_design',
      amendment: {
        file: '02-design.md',
        anchor: 'mock anchor',
        before,
        after,
        changelog_entry: '2026-05-02 — mock amendment',
      },
    } as ArbiterExit,
    raw: rawEnvelope(costUsd),
  };
}
function arbiterPushback(costUsd = 0.3): ArbiterDispatchResult {
  return {
    exit: {
      verdict: 'pushback',
      pushback_clarification: 'builder misread; chips are out of scope',
    } as ArbiterExit,
    raw: rawEnvelope(costUsd),
  };
}

function makeDeps(overrides: Partial<OrchestrateDeps> = {}): OrchestrateDeps {
  return {
    dispatchBuilder: vi.fn(),
    dispatchColdReader: vi.fn(),
    dispatchArbiter: vi.fn(),
    applyAmendment: vi.fn(
      (): ApplyAmendmentResult => ({ ok: true, filePath: 'mock' })
    ),
    resolveHeadSha: () => 'commit-abc',
    commitCheckboxFlip: () => ({
      flipped: true,
      newHeadSha: 'commit-flip',
    }),
    ...overrides,
  };
}

describe('orchestrateTask — happy path', () => {
  it('build success → review approve → outcome=success', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValue(builderSuccess('abc123')),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewApprove()),
    });

    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });

    expect(result.outcome).toBe('success');
    expect(result.builderDispatches).toBe(1);
    expect(result.arbiterDispatches).toBe(0);
    // Per finding #9: lastCommitSha comes from resolveHeadSha (mock default
    // 'commit-abc'), NOT from the builder's reported (potentially hallucinated)
    // commit_sha 'abc123'. See dedicated finding-#9 test below.
    expect(result.lastCommitSha).toBe('commit-abc');
    expect(result.totalCostUsd).toBeCloseTo(0.77); // 0.5 + 0.27
    expect(deps.dispatchBuilder).toHaveBeenCalledTimes(1);
    expect(deps.dispatchColdReader).toHaveBeenCalledTimes(1);
    expect(deps.dispatchArbiter).not.toHaveBeenCalled();
  });
});

describe('orchestrateTask — auto checkbox-flip on success (round-47 escalation)', () => {
  it('calls commitCheckboxFlip when taskListPath is provided + success outcome', async () => {
    const flip = vi.fn(() => ({
      flipped: true as const,
      newHeadSha: 'commit-flip',
    }));
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValue(builderSuccess('abc123')),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewApprove()),
      commitCheckboxFlip: flip,
    });

    const result = await orchestrateTask({
      taskId: 'T-30',
      taskListPath: 'docs/specs/incident-capture/03-tasks.md',
      statePath,
      cwd: workDir,
      deps,
    });

    expect(result.outcome).toBe('success');
    expect(flip).toHaveBeenCalledWith(
      'docs/specs/incident-capture/03-tasks.md',
      'T-30',
      workDir
    );
    // The flip's newHeadSha becomes the orchestrate result's lastCommitSha.
    expect(result.lastCommitSha).toBe('commit-flip');
    const flipEvent = result.state.events.find(
      (e) => e.type === 'checkbox_flip'
    );
    expect(flipEvent).toBeDefined();
    expect(flipEvent!.payload.flipped).toBe(true);
    expect(flipEvent!.payload.new_head_sha).toBe('commit-flip');
  });

  it('skips commitCheckboxFlip when taskListPath is omitted', async () => {
    const flip = vi.fn();
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValue(builderSuccess('abc123')),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewApprove()),
      commitCheckboxFlip: flip,
    });
    const result = await orchestrateTask({
      taskId: 'T-30',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('success');
    expect(flip).not.toHaveBeenCalled();
    expect(result.lastCommitSha).toBe('commit-abc');
  });

  it('records the skip-reason in checkbox_flip event when flip returns flipped=false', async () => {
    const flip = vi.fn(() => ({
      flipped: false as const,
      newHeadSha: null,
      reason: 'task T-30 is already [x]',
    }));
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValue(builderSuccess('abc123')),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewApprove()),
      commitCheckboxFlip: flip,
    });
    const result = await orchestrateTask({
      taskId: 'T-30',
      taskListPath: 'docs/specs/incident-capture/03-tasks.md',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('success');
    // No new commit happened, so lastCommitSha falls back to the builder
    // commit (resolveHeadSha mock returns 'commit-abc').
    expect(result.lastCommitSha).toBe('commit-abc');
    const flipEvent = result.state.events.find(
      (e) => e.type === 'checkbox_flip'
    );
    expect(flipEvent!.payload.flipped).toBe(false);
    expect(flipEvent!.payload.reason).toMatch(/already/);
  });

  it('does NOT call commitCheckboxFlip on cold-reader veto (task did not ship)', async () => {
    const flip = vi.fn();
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValue(builderSuccess('abc123')),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewVeto(1, 'BR-26')),
      commitCheckboxFlip: flip,
    });
    const result = await orchestrateTask({
      taskId: 'T-30',
      taskListPath: 'docs/specs/incident-capture/03-tasks.md',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('halt_builder_error_veto');
    expect(flip).not.toHaveBeenCalled();
  });
});

describe('orchestrateTask — full escalation cycle', () => {
  it('build success → review veto scope 4 → arbiter amend_design → apply → re-build → re-review approve', async () => {
    writeFixture('02-design.md', '# Design\n\nbefore-marker\n');
    const deps = makeDeps({
      dispatchBuilder: vi
        .fn()
        .mockResolvedValueOnce(builderSuccess('first-commit'))
        .mockResolvedValueOnce(builderSuccess('second-commit')),
      dispatchColdReader: vi
        .fn()
        .mockResolvedValueOnce(reviewVeto(4, '§D2'))
        .mockResolvedValueOnce(reviewApprove()),
      dispatchArbiter: vi
        .fn()
        .mockResolvedValueOnce(
          arbiterAmendDesign('before-marker', 'after-marker')
        ),
    });

    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });

    expect(result.outcome).toBe('success');
    expect(result.builderDispatches).toBe(2);
    expect(result.arbiterDispatches).toBe(1);
    // Per finding #9: lastCommitSha comes from resolveHeadSha (mock default
    // 'commit-abc'), NOT from the builder's reported 'second-commit'.
    expect(result.lastCommitSha).toBe('commit-abc');
    expect(deps.applyAmendment).toHaveBeenCalledTimes(1);
    const amendmentCalls = (deps.applyAmendment as ReturnType<typeof vi.fn>)
      .mock.calls;
    expect(amendmentCalls[0]?.[0].before).toBe('before-marker');
  });
});

describe('orchestrateTask — scope-1/2 veto halts for human', () => {
  it('build success → review veto scope 2 → halt_builder_error_veto', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValue(builderSuccess('abc')),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewVeto(2, 'AC-3')),
    });

    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });

    expect(result.outcome).toBe('halt_builder_error_veto');
    expect(result.haltReason).toMatch(/scope_check 2/);
    expect(deps.dispatchArbiter).not.toHaveBeenCalled();
  });

  it('scope 1 also halts', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValue(builderSuccess('abc')),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewVeto(1, 'BR-12')),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('halt_builder_error_veto');
  });
});

describe('orchestrateTask — builder spec_gap → arbiter directly', () => {
  it('skips cold-reader and goes straight to arbiter', async () => {
    writeFixture('02-design.md', '# Design\n\nbefore\n');
    const deps = makeDeps({
      dispatchBuilder: vi
        .fn()
        .mockResolvedValueOnce(builderSpecGap('§D3', 'gap'))
        .mockResolvedValueOnce(builderSuccess('post-amend-commit')),
      dispatchArbiter: vi
        .fn()
        .mockResolvedValueOnce(arbiterAmendDesign('before', 'after')),
      dispatchColdReader: vi.fn().mockResolvedValueOnce(reviewApprove()),
    });

    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });

    expect(result.outcome).toBe('success');
    expect(deps.dispatchColdReader).toHaveBeenCalledTimes(1); // only after re-build
  });
});

describe('orchestrateTask — arbiter pushback halts in v1', () => {
  it('halt_pushback_unsupported with clarification surfaced', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi
        .fn()
        .mockResolvedValueOnce(builderSpecGap('§D3', 'gap')),
      dispatchArbiter: vi.fn().mockResolvedValueOnce(arbiterPushback()),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('halt_pushback_unsupported');
    expect(result.haltReason).toMatch(/builder misread/);
  });
});

describe('orchestrateTask — apply-amendment failure halts', () => {
  it('halt_amendment_apply_failed when before does not match', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi
        .fn()
        .mockResolvedValueOnce(builderSpecGap('§D3', 'gap')),
      dispatchArbiter: vi
        .fn()
        .mockResolvedValueOnce(arbiterAmendDesign('absent', 'replacement')),
      applyAmendment: vi.fn(
        (): ApplyAmendmentResult => ({
          ok: false,
          error: 'before not found',
        })
      ),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('halt_amendment_apply_failed');
    expect(result.haltReason).toMatch(/before not found/);
  });
});

describe('orchestrateTask — caps', () => {
  it('halt_retry_cap when builder dispatched maxBuilderDispatches times', async () => {
    writeFixture('02-design.md', '# D\n\nbefore\n');
    // Loop pattern: build success → review veto scope 4 → arbiter amend → apply → repeat
    const deps = makeDeps({
      dispatchBuilder: vi
        .fn()
        .mockResolvedValue(builderSuccess('cap-commit', 0.1)),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewVeto(4, '§D2', 0.1)),
      dispatchArbiter: vi
        .fn()
        .mockResolvedValue(arbiterAmendDesign('before', 'after', 0.1)),
      applyAmendment: vi.fn(
        (): ApplyAmendmentResult => ({ ok: true, filePath: 'mock' })
      ),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
      maxBuilderDispatches: 2,
      maxArbiterDispatches: 5,
      maxCostUsd: 100,
    });
    expect(result.outcome).toBe('halt_retry_cap');
    expect(result.builderDispatches).toBe(2);
  });

  it('halt_amendment_cap when arbiter dispatched maxArbiterDispatches times', async () => {
    writeFixture('02-design.md', '# D\n\nbefore\n');
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValue(builderSuccess('c', 0.1)),
      dispatchColdReader: vi.fn().mockResolvedValue(reviewVeto(4, '§D2', 0.1)),
      dispatchArbiter: vi
        .fn()
        .mockResolvedValue(arbiterAmendDesign('before', 'after', 0.1)),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
      maxBuilderDispatches: 10,
      maxArbiterDispatches: 1,
      maxCostUsd: 100,
    });
    expect(result.outcome).toBe('halt_amendment_cap');
    expect(result.arbiterDispatches).toBe(1);
  });

  it('halt_cost_cap when total cost exceeds budget', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValueOnce(builderSuccess('a', 5.0)),
      dispatchColdReader: vi.fn(),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
      maxCostUsd: 1.0,
    });
    expect(result.outcome).toBe('halt_cost_cap');
    // cold-reader should NOT have been called because cost was checked first
    expect(deps.dispatchColdReader).not.toHaveBeenCalled();
  });
});

describe('orchestrateTask — verify_fail / parse failures', () => {
  it('builder verify_fail halts immediately', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValueOnce(builderVerifyFail()),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('halt_verify_fail');
  });

  it('builder parse_error halts as verify_fail', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValueOnce({
        exit: null,
        raw: rawEnvelope(0.5),
        parseError: 'no status field',
      }),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('halt_verify_fail');
    expect(result.haltReason).toMatch(/parse_error/);
  });
});

describe('orchestrateTask — state.json correctness', () => {
  it('writes orchestrate_start, dispatch_*, orchestrate_end events in order', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValueOnce(builderSuccess('x')),
      dispatchColdReader: vi.fn().mockResolvedValueOnce(reviewApprove()),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    const types = result.state.events.map((e) => e.type);
    expect(types).toEqual([
      'orchestrate_start',
      'dispatch_start',
      'dispatch_end',
      'dispatch_start',
      'dispatch_end',
      'orchestrate_end',
    ]);
  });

  it('uses resolveHeadSha (NOT builder.exit.commit_sha) as the source of truth for the post-build SHA — finding #9', async () => {
    // Builder reports a hallucinated SHA; resolveHeadSha returns the real one.
    const deps = makeDeps({
      dispatchBuilder: vi
        .fn()
        .mockResolvedValueOnce(builderSuccess('hallucinated-deadbeef')),
      dispatchColdReader: vi.fn().mockResolvedValueOnce(reviewApprove()),
      resolveHeadSha: () => 'real-head-cafe',
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.lastCommitSha).toBe('real-head-cafe');

    // The dispatch_start for cold-reader must reference the REAL sha
    // (cold-reader's diff range needs git to actually find the commit).
    const coldStart = result.state.events.find(
      (e) =>
        e.type === 'dispatch_start' &&
        (e.payload as { role?: string }).role === 'cold-reader'
    );
    expect(coldStart).toBeTruthy();
    expect((coldStart!.payload as { diff_sha?: string }).diff_sha).toBe(
      'real-head-cafe'
    );
  });

  it('halts gracefully when resolveHeadSha throws — finding #9 robustness', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValueOnce(builderSuccess('any')),
      resolveHeadSha: () => {
        throw new Error('not a git repository');
      },
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    expect(result.outcome).toBe('halt_verify_fail');
    expect(result.haltReason).toMatch(/not a git repository/);
  });

  it('captures full cold-reader findings array in dispatch_end payload — finding #10', async () => {
    const deps = makeDeps({
      dispatchBuilder: vi.fn().mockResolvedValueOnce(builderSuccess('x')),
      dispatchColdReader: vi.fn().mockResolvedValueOnce(reviewVeto(2, 'AC-4')),
    });
    const result = await orchestrateTask({
      taskId: 'T-22',
      statePath,
      cwd: workDir,
      deps,
    });
    const coldEnd = result.state.events.find(
      (e) =>
        e.type === 'dispatch_end' &&
        (e.payload as { role?: string }).role === 'cold-reader'
    );
    expect(coldEnd).toBeTruthy();
    const payload = coldEnd!.payload as {
      verdict: string;
      findings_count: number;
      findings: Array<{
        severity: string;
        scope_check: number;
        cited_section: string;
        evidence: string;
        description: string;
      }>;
    };
    expect(payload.verdict).toBe('veto');
    expect(payload.findings_count).toBe(1);
    expect(payload.findings).toHaveLength(1);
    expect(payload.findings[0]).toMatchObject({
      severity: 'HIGH',
      scope_check: 2,
      cited_section: 'AC-4',
      description: expect.stringContaining('mock veto'),
    });
  });

  it('records amendment_applied event on successful application', async () => {
    writeFixture('02-design.md', '# D\n\nbefore\n');
    const deps = makeDeps({
      dispatchBuilder: vi
        .fn()
        .mockResolvedValueOnce(builderSpecGap('§D3', 'gap'))
        .mockResolvedValueOnce(builderSuccess('post')),
      dispatchArbiter: vi
        .fn()
        .mockResolvedValueOnce(arbiterAmendDesign('before', 'after')),
      dispatchColdReader: vi.fn().mockResolvedValueOnce(reviewApprove()),
    });
    const result = await orchestrateTask({
      taskId: 'T-14',
      statePath,
      cwd: workDir,
      deps,
    });
    const types = result.state.events.map((e) => e.type);
    expect(types).toContain('amendment_applied');
  });
});

function writeFixture(name: string, body: string): void {
  writeFileSync(join(specDir, name), body, 'utf8');
}

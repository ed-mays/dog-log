/**
 * Operator pushback dispatcher.
 *
 * Closes finding #7 (round 37): when the cold-reader returns `approve` but the
 * operator catches a divergence on review, today the only options are
 * (a) operator-fix in a follow-up commit (defeats the orchestrator),
 * (b) revert and re-dispatch fresh (likely reproduces the bug), or
 * (c) reset, manually re-render the input, append findings, shell to
 *     `claude -p` directly. (c) was the round-37/41 manual workaround that cost
 * ~12 min of operator labor and wrote nothing to state.json.
 *
 * This module is the (c) path automated. The operator authors a findings
 * markdown file, runs `harness pushback T-N --findings findings.md [--reset]`,
 * and the dispatcher renders the standard builder input, appends the findings
 * as an `## Operator pushback` section, dispatches the builder, and logs a
 * `pushback_dispatch` event to state.json.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { buildBuilderInput, formatBuilderInputMarkdown } from './builder-input';
import { parseTaskList } from './task-parser';
import { dispatchSubagent, type DispatchResult } from './subagent-dispatch';
import {
  parseBuilderExit,
  type BuilderExit,
} from './dispatch/builder-dispatch';
import { appendEvent, defaultStatePath } from './state-store';

export interface PushbackDispatchOptions {
  taskId: string;
  findingsPath: string;
  /** When true, run `git reset --hard HEAD~1` before dispatching the builder.
   * Use to discard the previous orchestrator-driven commit so the builder has
   * a clean tree to commit on top of. */
  reset?: boolean;
  /** Override task-list path. */
  taskListPath?: string;
  /** Override builder system prompt. */
  promptPath?: string;
  /** Working directory. */
  cwd?: string;
  /** Override state.json path. */
  statePath?: string;
  /** Test seams. */
  spawnImpl?: typeof import('node:child_process').spawn;
  resetImpl?: () => void;
  resolveHeadShaImpl?: () => string;
}

export interface PushbackDispatchResult {
  exit: BuilderExit | null;
  raw: DispatchResult;
  parseError?: string;
  /** SHA produced by the pushback dispatch (resolved from HEAD post-build). */
  commitSha?: string;
  /** Path that was rendered + sent to the subagent (kept for debug). */
  renderedInputPath?: string;
}

const DEFAULT_TASK_LIST = 'docs/specs/incident-capture/03-tasks.md';
const DEFAULT_PROMPT = 'scripts/harness/lib/prompts/builder.md';
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

const DEFAULT_DISALLOWED_TOOLS = [
  'Bash(firebase deploy:*)',
  'Bash(vercel deploy:*)',
  'Bash(vercel --prod:*)',
  'Bash(gcloud:*)',
  'Bash(kubectl apply:*)',
  'Bash(terraform apply:*)',
];

export async function dispatchPushback(
  opts: PushbackDispatchOptions
): Promise<PushbackDispatchResult> {
  const taskListPath = opts.taskListPath ?? DEFAULT_TASK_LIST;
  const promptPath = opts.promptPath ?? DEFAULT_PROMPT;
  const statePath = opts.statePath ?? defaultStatePath(opts.cwd);
  const findingsPath = resolve(opts.cwd ?? process.cwd(), opts.findingsPath);

  if (!existsSync(findingsPath)) {
    throw new Error(
      `pushback dispatch: findings file not found: ${findingsPath}`
    );
  }
  const findingsBody = readFileSync(findingsPath, 'utf8');
  if (!findingsBody.trim()) {
    throw new Error(
      `pushback dispatch: findings file is empty: ${findingsPath}`
    );
  }

  if (opts.reset) {
    const reset = opts.resetImpl ?? defaultReset(opts.cwd);
    reset();
  }

  const taskListMd = readFileSync(taskListPath, 'utf8');
  const systemPrompt = readFileSync(promptPath, 'utf8');
  const featureDir = dirname(taskListPath);
  const specMd = readFileSync(join(featureDir, '01-spec.md'), 'utf8');
  const designMd = readFileSync(join(featureDir, '02-design.md'), 'utf8');

  const parsed = parseTaskList(taskListMd);
  const task = parsed.tasks.find((t) => t.id === opts.taskId);
  if (!task) {
    throw new Error(
      `pushback dispatch: task ${opts.taskId} not found in ${taskListPath}`
    );
  }
  const builderInput = buildBuilderInput({
    task,
    specMarkdown: specMd,
    designMarkdown: designMd,
  });
  const inputMd = formatBuilderInputMarkdown(builderInput);

  const pushbackSection = buildPushbackSection(findingsBody);
  const fullInput = `${inputMd}\n\n${pushbackSection}`;
  const fullPrompt = `${systemPrompt}\n\n---\n\n${fullInput}`;

  const raw = await dispatchSubagent({
    prompt: fullPrompt,
    model: 'sonnet',
    permissionMode: 'bypassPermissions',
    disallowedTools: DEFAULT_DISALLOWED_TOOLS,
    cwd: opts.cwd,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    spawnImpl: opts.spawnImpl,
  });

  let exit: BuilderExit | null = null;
  let parseError: string | undefined;
  try {
    exit = parseBuilderExit(raw.resultText);
  } catch (err) {
    parseError = err instanceof Error ? err.message : String(err);
  }

  // Resolve the actual HEAD post-dispatch (per finding #9, never trust the
  // builder's reported commit_sha).
  let commitSha: string | undefined;
  try {
    const resolveHead = opts.resolveHeadShaImpl ?? defaultResolveHead(opts.cwd);
    commitSha = resolveHead();
  } catch {
    commitSha = undefined;
  }

  appendEvent(statePath, {
    task_id: opts.taskId,
    type: 'pushback_dispatch',
    payload: {
      role: 'builder',
      cost_usd: raw.costUsd,
      duration_ms: raw.durationMs,
      num_turns: raw.numTurns,
      session_id: raw.sessionId,
      stop_reason: raw.stopReason,
      findings_source: opts.findingsPath,
      reset: opts.reset === true,
      commit_sha: commitSha,
      ...(exit && exit.status === 'success' ? { status: 'success' } : {}),
      ...(parseError
        ? { parse_error: parseError, raw_result_text: raw.resultText }
        : {}),
    },
  });

  return { exit, raw, parseError, commitSha };
}

/** Render the operator pushback section that gets appended to the standard
 * builder input. Keep the format stable so the builder's prompt training
 * sees the same shape every time. */
export function buildPushbackSection(findingsBody: string): string {
  return [
    '---',
    '',
    '## Operator pushback re-dispatch',
    '',
    'An earlier dispatch shipped a commit that the operator (or cold-reader)',
    'reviewed and rejected. The previous commit may already be reset (see the',
    '`reset=true` flag on the harness invocation). Honor the spec verbatim,',
    'addressing each finding below as a constraint on this re-dispatch:',
    '',
    findingsBody.trim(),
  ].join('\n');
}

function defaultReset(cwd?: string): () => void {
  return () => {
    // Safety: refuse to reset if HEAD~1 doesn't exist (e.g., initial commit).
    try {
      execSync('git rev-parse HEAD~1', {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch {
      throw new Error(
        'pushback dispatch: --reset requested but HEAD~1 does not exist (refusing to reset on an initial commit)'
      );
    }
    execSync('git reset --hard HEAD~1', { cwd, stdio: 'inherit' });
  };
}

function defaultResolveHead(cwd?: string): () => string {
  return () => execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim();
}

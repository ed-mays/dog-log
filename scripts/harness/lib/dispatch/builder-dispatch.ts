/**
 * Builder dispatcher.
 *
 * Loads the builder system prompt + per-task input, spawns a fresh
 * `claude -p` subagent, and parses the structured exit per builder.md's
 * output contract.
 *
 * The builder is configured with:
 *   - model: sonnet (project default for the role)
 *   - permissionMode: acceptEdits (it WILL write code + run verify + commit)
 *   - disallowedTools: blanket Bash deny on infra-deploy commands as a
 *     belt-and-suspenders backup to the round-25 builder.md no-deploy rule
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  buildBuilderInput,
  formatBuilderInputMarkdown,
} from '../builder-input';
import { parseTaskList } from '../task-parser';
import { dispatchSubagent, type DispatchResult } from '../subagent-dispatch';
import { parseStructuredExit } from './parse-structured-exit';
import type { spawn as spawnType } from 'node:child_process';

export type BuilderStatus =
  | 'success'
  | 'spec_gap'
  | 'verify_fail'
  | 'budget_exceeded';

export interface BuilderExitSuccess {
  status: 'success';
  commit_sha?: string;
  files_touched?: string[];
  verify_run?: Record<string, string>;
  notes?: string;
}

export interface BuilderExitSpecGap {
  status: 'spec_gap';
  cited_section?: string;
  gap_description?: string;
  suggested_amendment?: string;
  files_inspected?: string[];
}

export interface BuilderExitVerifyFail {
  status: 'verify_fail';
  verify_command?: string;
  output_tail?: string;
  attempts?: number;
}

export interface BuilderExitBudgetExceeded {
  status: 'budget_exceeded';
  spent?: Record<string, number>;
  last_action?: string;
}

export type BuilderExit =
  | BuilderExitSuccess
  | BuilderExitSpecGap
  | BuilderExitVerifyFail
  | BuilderExitBudgetExceeded;

export interface BuilderDispatchOptions {
  taskId: string;
  /** Task-list markdown override (defaults to incident-capture). */
  taskListPath?: string;
  /** Builder system prompt path (defaults to scripts/harness/lib/prompts/builder.md). */
  promptPath?: string;
  /** Override permission mode (default: acceptEdits). */
  permissionMode?: 'acceptEdits' | 'bypassPermissions' | 'plan';
  /** Override timeout (default: 30 minutes for builder). */
  timeoutMs?: number;
  /** Working directory for the subagent. */
  cwd?: string;
  /** Inject spawn for tests. */
  spawnImpl?: typeof spawnType;
}

export interface BuilderDispatchResult {
  /** The parsed structured exit, OR null when the subagent did not emit one. */
  exit: BuilderExit | null;
  /** Raw envelope from claude -p (cost, duration, turns, session, full result text). */
  raw: DispatchResult;
  /** When `exit` is null, why the parse failed. */
  parseError?: string;
}

const DEFAULT_TASK_LIST = 'docs/specs/incident-capture/03-tasks.md';
const DEFAULT_PROMPT = 'scripts/harness/lib/prompts/builder.md';
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

// Belt-and-suspenders deny list to back up the no-deploy builder.md rule.
// Any infra-deploy attempt fails at the tool-permission boundary even if the
// model misreads its own system prompt. Names map to Claude Code Bash patterns.
const DEFAULT_DISALLOWED_TOOLS = [
  'Bash(firebase deploy:*)',
  'Bash(vercel deploy:*)',
  'Bash(vercel --prod:*)',
  'Bash(gcloud:*)',
  'Bash(kubectl apply:*)',
  'Bash(terraform apply:*)',
];

export async function dispatchBuilder(
  opts: BuilderDispatchOptions
): Promise<BuilderDispatchResult> {
  const taskListPath = opts.taskListPath ?? DEFAULT_TASK_LIST;
  const promptPath = opts.promptPath ?? DEFAULT_PROMPT;

  const taskListMd = readFileSync(taskListPath, 'utf8');
  const systemPrompt = readFileSync(promptPath, 'utf8');
  const featureDir = dirname(taskListPath);
  const specMd = readFileSync(join(featureDir, '01-spec.md'), 'utf8');
  const designMd = readFileSync(join(featureDir, '02-design.md'), 'utf8');

  const parsed = parseTaskList(taskListMd);
  const task = parsed.tasks.find((t) => t.id === opts.taskId);
  if (!task) {
    throw new Error(
      `builder dispatch: task ${opts.taskId} not found in ${taskListPath}`
    );
  }
  const builderInput = buildBuilderInput({
    task,
    specMarkdown: specMd,
    designMarkdown: designMd,
  });
  const inputMd = formatBuilderInputMarkdown(builderInput);

  const fullPrompt = `${systemPrompt}\n\n---\n\n${inputMd}`;

  const raw = await dispatchSubagent({
    prompt: fullPrompt,
    model: 'sonnet',
    permissionMode: opts.permissionMode ?? 'acceptEdits',
    disallowedTools: DEFAULT_DISALLOWED_TOOLS,
    cwd: opts.cwd,
    timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    spawnImpl: opts.spawnImpl,
  });

  try {
    const exit = parseBuilderExit(raw.resultText);
    return { exit, raw };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { exit: null, raw, parseError: reason };
  }
}

export function parseBuilderExit(text: string): BuilderExit {
  const parsed = parseStructuredExit<Record<string, unknown>>(text);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(
      `builder dispatch: could not parse structured exit from response. First 500 chars: ${text.slice(0, 500)}`
    );
  }
  const status = parsed.status as string | undefined;
  if (
    status !== 'success' &&
    status !== 'spec_gap' &&
    status !== 'verify_fail' &&
    status !== 'budget_exceeded'
  ) {
    throw new Error(
      `builder dispatch: missing or invalid status field (got ${JSON.stringify(status)})`
    );
  }
  return parsed as unknown as BuilderExit;
}

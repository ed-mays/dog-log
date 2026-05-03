/**
 * Drift-arbiter dispatcher.
 *
 * Spawns the arbiter subagent in `acceptEdits` permission mode (it can edit
 * spec/design files) but with a tool deny on Bash to keep it from running
 * commands. The arbiter is read-mostly; the only writes it should perform
 * are to the cited spec/design files.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  buildDriftArbiterInput,
  formatDriftArbiterInputMarkdown,
  type SpecGapPayload,
} from '../drift-arbiter-input';
import { dispatchSubagent, type DispatchResult } from '../subagent-dispatch';
import { parseStructuredExit } from './parse-structured-exit';
import type { spawn as spawnType } from 'node:child_process';

export type ArbiterVerdict =
  | 'amend_spec'
  | 'amend_design'
  | 'amend_task'
  | 'pushback';

/** Amendment payload per the arbiter prompt's output contract. */
export interface ArbiterAmendment {
  /** Target file: `01-spec.md` | `02-design.md` | `03-tasks.md`. */
  file: string;
  /** Stable identifier where the change lands (e.g. 'BR-15', '§D3 Indexes table'). */
  anchor: string;
  /** Exact verbatim text being replaced; empty string for pure addition. */
  before: string;
  /** Exact text to substitute. */
  after: string;
  /** Text to append to the artifact's changelog (§10 / §D11 / §T0). */
  changelog_entry: string;
}

export interface ArbiterExit {
  verdict: ArbiterVerdict;
  /** One paragraph: why this verdict, why minimal. */
  rationale?: string;
  /** Present when verdict is amend_*; structured per ArbiterAmendment. */
  amendment?: ArbiterAmendment;
  /** Only present when verdict='pushback'. */
  pushback_clarification?: string;
  /** Optional out-of-scope observations the human might want. */
  notes?: string;
}

export interface ArbiterDispatchOptions {
  specGap: SpecGapPayload;
  taskListPath?: string;
  promptPath?: string;
  cwd?: string;
  timeoutMs?: number;
  spawnImpl?: typeof spawnType;
}

export interface ArbiterDispatchResult {
  exit: ArbiterExit | null;
  raw: DispatchResult;
  parseError?: string;
}

const DEFAULT_TASK_LIST = 'docs/specs/incident-capture/03-tasks.md';
const DEFAULT_PROMPT = 'scripts/harness/lib/prompts/drift-arbiter.md';
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

export async function dispatchArbiter(
  opts: ArbiterDispatchOptions
): Promise<ArbiterDispatchResult> {
  const taskListPath = opts.taskListPath ?? DEFAULT_TASK_LIST;
  const promptPath = opts.promptPath ?? DEFAULT_PROMPT;

  const tasksMd = readFileSync(taskListPath, 'utf8');
  const systemPrompt = readFileSync(promptPath, 'utf8');
  const featureDir = dirname(taskListPath);
  const specMd = readFileSync(join(featureDir, '01-spec.md'), 'utf8');
  const designMd = readFileSync(join(featureDir, '02-design.md'), 'utf8');

  const arbiterInput = buildDriftArbiterInput({
    spec_gap: opts.specGap,
    specMarkdown: specMd,
    designMarkdown: designMd,
    tasksMarkdown: tasksMd,
  });
  const inputMd = formatDriftArbiterInputMarkdown(arbiterInput);

  const fullPrompt = `${systemPrompt}\n\n---\n\n${inputMd}`;

  const raw = await dispatchSubagent({
    prompt: fullPrompt,
    model: 'sonnet',
    permissionMode: 'acceptEdits',
    // Arbiter writes spec/design only, never runs commands.
    disallowedTools: ['Bash'],
    cwd: opts.cwd,
    timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    spawnImpl: opts.spawnImpl,
  });

  try {
    const exit = parseArbiterExit(raw.resultText);
    return { exit, raw };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { exit: null, raw, parseError: reason };
  }
}

export function parseArbiterExit(text: string): ArbiterExit {
  const parsed = parseStructuredExit<Record<string, unknown>>(text);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(
      `arbiter dispatch: could not parse structured exit. First 500 chars: ${text.slice(0, 500)}`
    );
  }
  const verdict = parsed.verdict as string | undefined;
  if (
    verdict !== 'amend_spec' &&
    verdict !== 'amend_design' &&
    verdict !== 'amend_task' &&
    verdict !== 'pushback'
  ) {
    throw new Error(
      `arbiter dispatch: invalid verdict (got ${JSON.stringify(verdict)})`
    );
  }
  return parsed as unknown as ArbiterExit;
}

/**
 * Cold-reader dispatcher.
 *
 * Spawns the cold-reader subagent in `plan` permission mode (read-only) and
 * parses the verdict + findings JSON per cold-reader-code.md.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import {
  buildColdReaderInput,
  formatColdReaderInputMarkdown,
} from '../cold-reader-input';
import { checkTaskContract } from '../task-contract-check';
import { parseTaskList } from '../task-parser';
import { dispatchSubagent, type DispatchResult } from '../subagent-dispatch';
import { parseStructuredExit } from './parse-structured-exit';
import type { spawn as spawnType } from 'node:child_process';

export type ColdReaderVerdict = 'approve' | 'veto';
export type ColdReaderSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ColdReaderFinding {
  severity: ColdReaderSeverity;
  scope_check: 1 | 2 | 3 | 4 | 5 | 6;
  cited_section: string;
  evidence: string;
  description: string;
}

export interface ColdReaderExit {
  task_id: string;
  verdict: ColdReaderVerdict;
  findings: ColdReaderFinding[];
  summary?: string;
  notes?: string;
}

export interface ColdReaderDispatchOptions {
  taskId: string;
  /** Git ref-range to diff (default: HEAD~1..HEAD). */
  diffRange?: string;
  taskListPath?: string;
  promptPath?: string;
  cwd?: string;
  timeoutMs?: number;
  spawnImpl?: typeof spawnType;
}

export interface ColdReaderDispatchResult {
  exit: ColdReaderExit | null;
  raw: DispatchResult;
  parseError?: string;
}

const DEFAULT_TASK_LIST = 'docs/specs/incident-capture/03-tasks.md';
const DEFAULT_PROMPT = 'scripts/harness/lib/prompts/cold-reader-code.md';
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

export async function dispatchColdReader(
  opts: ColdReaderDispatchOptions
): Promise<ColdReaderDispatchResult> {
  const taskListPath = opts.taskListPath ?? DEFAULT_TASK_LIST;
  const promptPath = opts.promptPath ?? DEFAULT_PROMPT;
  const diffRange = opts.diffRange ?? 'HEAD~1..HEAD';

  const taskListMd = readFileSync(taskListPath, 'utf8');
  const systemPrompt = readFileSync(promptPath, 'utf8');
  const featureDir = dirname(taskListPath);
  const specMd = readFileSync(join(featureDir, '01-spec.md'), 'utf8');
  const designMd = readFileSync(join(featureDir, '02-design.md'), 'utf8');

  const diff = readGitDiff(diffRange, opts.cwd);

  const parsed = parseTaskList(taskListMd);
  const task = parsed.tasks.find((t) => t.id === opts.taskId);
  if (!task) {
    throw new Error(`cold-reader dispatch: task ${opts.taskId} not found`);
  }
  // Axis 6 finding #6: pre-flag task-contract symbols mechanically rather
  // than relying on the cold-reader to re-derive them from the 'What' line.
  const taskContractCheck = checkTaskContract(task.what, diff);
  const crInput = buildColdReaderInput({
    task,
    specMarkdown: specMd,
    designMarkdown: designMd,
    diff,
    taskContractCheck,
  });
  const inputMd = formatColdReaderInputMarkdown(crInput);

  const fullPrompt = `${systemPrompt}\n\n---\n\n${inputMd}`;

  const raw = await dispatchSubagent({
    prompt: fullPrompt,
    model: 'sonnet',
    permissionMode: 'plan',
    cwd: opts.cwd,
    timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    spawnImpl: opts.spawnImpl,
  });

  try {
    const exit = parseColdReaderExit(raw.resultText);
    return { exit, raw };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { exit: null, raw, parseError: reason };
  }
}

function readGitDiff(range: string, cwd?: string): string {
  return execSync(`git diff ${range}`, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

export function parseColdReaderExit(text: string): ColdReaderExit {
  const parsed = parseStructuredExit<Record<string, unknown>>(text);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(
      `cold-reader dispatch: could not parse structured exit. First 500 chars: ${text.slice(0, 500)}`
    );
  }
  const verdict = parsed.verdict as string | undefined;
  if (verdict !== 'approve' && verdict !== 'veto') {
    throw new Error(
      `cold-reader dispatch: invalid verdict (got ${JSON.stringify(verdict)})`
    );
  }
  const findings = (parsed.findings ?? []) as ColdReaderFinding[];
  if (!Array.isArray(findings)) {
    throw new Error(
      `cold-reader dispatch: findings must be an array (got ${typeof findings})`
    );
  }
  return {
    task_id: String(parsed.task_id ?? ''),
    verdict,
    findings,
    summary: parsed.summary as string | undefined,
    notes: parsed.notes as string | undefined,
  };
}

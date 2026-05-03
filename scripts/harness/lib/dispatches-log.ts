/**
 * Long-term dispatch log (Axis 5 — round 43).
 *
 * Per-run state lives in `.harness/state.json` (or the per-run namespaced
 * variant). That file is loaded-and-rewritten on every appendEvent — fine
 * for current-run audit but it's not durable across many runs.
 *
 * `.harness/dispatches.jsonl` is the long-term store: one line per
 * dispatch_end (or pushback_dispatch) event, append-only, never overwritten.
 * Spans every run, every task, the lifetime of the project. Easy to grep,
 * easy to aggregate in `harness stats`.
 *
 * Schema is intentionally a SUPERSET of `dispatch_end` payload — every field
 * the orchestrator already records is preserved, plus run_id + ts + task_id
 * so each line is self-describing without needing context from the
 * surrounding state.json.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface DispatchLogEntry {
  /** ISO 8601 timestamp when the dispatch ended. */
  ts: string;
  /** Run identifier from state.json (e.g. "T-14-1714329000000"). */
  run_id: string;
  /** Task identifier (e.g. "T-14"). */
  task_id: string;
  /** Role of the agent that ran. */
  role: 'builder' | 'cold-reader' | 'arbiter' | 'pushback';
  /** Cost of the dispatch in USD (subscription-quota equivalent). */
  cost_usd: number;
  /** Wall-clock duration in milliseconds. */
  duration_ms: number;
  /** Conversational turns the agent took. */
  num_turns: number;
  /** Session id from claude -p envelope. */
  session_id: string;
  /** Stop reason (end_turn, max_turns, etc.). */
  stop_reason: string;
  /** Builder-only: structured-exit status. */
  status?: 'success' | 'spec_gap' | 'verify_fail' | 'budget_exceeded';
  /** Cold-reader-only: verdict. */
  verdict?:
    | 'approve'
    | 'veto'
    | 'amend_spec'
    | 'amend_design'
    | 'amend_task'
    | 'pushback';
  /** Cold-reader-only: number of structured findings. */
  findings_count?: number;
  /** Cold-reader-only: structured findings array (per finding #10). */
  findings?: unknown[];
  /** Builder-only: commit SHA produced (always derived from `git rev-parse HEAD` per finding #9). */
  commit_sha?: string;
  /** When >1 dispatch of the same role for the same task in the same run. */
  attempt?: number;
  /** When the structured exit failed to parse. */
  parse_error?: string;
}

export function defaultDispatchesLogPath(cwd?: string): string {
  return resolve(cwd ?? process.cwd(), '.harness/dispatches.jsonl');
}

/**
 * Append one dispatch entry to the JSONL log. Atomic per-line write (one
 * appendFileSync == one entry == one filesystem operation, no partial-line
 * risk under reasonable load).
 */
export function appendDispatch(path: string, entry: DispatchLogEntry): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(path, `${JSON.stringify(entry)}\n`, 'utf8');
}

/**
 * Read the full log. Skips malformed lines silently (the log is append-only
 * but partial writes during an interrupt could leave a fragment; one bad
 * line shouldn't poison `harness stats`).
 */
export function loadDispatchesLog(path: string): DispatchLogEntry[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf8');
  const out: DispatchLogEntry[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as DispatchLogEntry);
    } catch {
      // Skip malformed line.
    }
  }
  return out;
}

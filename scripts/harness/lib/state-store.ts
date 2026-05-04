/**
 * Append-only event log for orchestrator runs.
 *
 * State lives at `.harness/state.json` (gitignored). Each `appendEvent` writes
 * a single line to the events array; the file is rewritten atomically. No
 * resume-from-mid-cycle in v1 — the log is purely an audit trail for cost,
 * duration, cycle counts, and per-task outcomes.
 *
 * Schema is intentionally narrow: any orchestrator-internal payload goes in
 * `event.payload` as an opaque object. Callers structure their own payloads.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { appendDispatch, type DispatchLogEntry } from './dispatches-log';

export type StateEventType =
  | 'orchestrate_start'
  | 'orchestrate_end'
  | 'dispatch_start'
  | 'dispatch_end'
  | 'amendment_applied'
  | 'amendment_apply_failed'
  | 'cycle_halt'
  | 'pushback_dispatch'
  | 'checkbox_flip';

export interface StateEvent {
  ts: string; // ISO 8601
  task_id: string;
  type: StateEventType;
  payload: Record<string, unknown>;
}

export interface OrchestratorState {
  run_id: string;
  started_at: string;
  events: StateEvent[];
}

export function defaultStatePath(cwd?: string): string {
  return resolve(cwd ?? process.cwd(), '.harness/state.json');
}

export function loadState(path: string): OrchestratorState | null {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw) as OrchestratorState;
  } catch {
    return null;
  }
}

export function initState(taskId: string, path: string): OrchestratorState {
  const state: OrchestratorState = {
    run_id: `${taskId}-${Date.now()}`,
    started_at: new Date().toISOString(),
    events: [],
  };
  writeStateAtomic(path, state);
  return state;
}

export interface AppendEventOptions {
  /** Override path for the long-term JSONL dispatches log (Axis 5).
   * Defaults to `.harness/dispatches.jsonl` in the same directory tree as
   * the state.json. Pass `null` to disable the dual-write entirely
   * (intended for tests or for opting out of the long-term log). */
  dispatchesLogPath?: string | null;
}

export function appendEvent(
  path: string,
  event: Omit<StateEvent, 'ts'> & { ts?: string },
  opts: AppendEventOptions = {}
): OrchestratorState {
  const state = loadState(path) ?? {
    run_id: `${event.task_id}-${Date.now()}`,
    started_at: new Date().toISOString(),
    events: [],
  };
  const ts = event.ts ?? new Date().toISOString();
  state.events.push({
    ts,
    task_id: event.task_id,
    type: event.type,
    payload: event.payload,
  });
  writeStateAtomic(path, state);

  // Per Axis 5 (round 43): every dispatch_end / pushback_dispatch ALSO
  // appends a self-describing line to the long-term JSONL log. Append-only,
  // never overwritten — survives across orchestrate runs and across tasks.
  if (event.type === 'dispatch_end' || event.type === 'pushback_dispatch') {
    if (opts.dispatchesLogPath !== null) {
      // Sibling of state.json — `dirname(path)` is the .harness/ directory
      // already; do NOT pass it to defaultDispatchesLogPath (which prepends
      // its own `.harness/`, producing the round-45 finding-#15 bug:
      // `.harness/.harness/dispatches.jsonl`).
      const logPath =
        opts.dispatchesLogPath ?? resolve(dirname(path), 'dispatches.jsonl');
      const entry = buildDispatchLogEntry(
        state.run_id,
        event.task_id,
        ts,
        event.payload
      );
      if (entry) appendDispatch(logPath, entry);
    }
  }

  return state;
}

/**
 * Project the state-event payload (which is `Record<string, unknown>` —
 * caller-shaped) onto the typed DispatchLogEntry shape. Defensive: returns
 * null if the payload doesn't have the minimum fields a dispatch entry
 * needs (cost_usd + role). This lets callers append non-dispatch events
 * to state.json without poisoning the long-term log.
 */
function buildDispatchLogEntry(
  runId: string,
  taskId: string,
  ts: string,
  payload: Record<string, unknown>
): DispatchLogEntry | null {
  const role = payload.role;
  const cost = payload.cost_usd;
  if (typeof role !== 'string' || typeof cost !== 'number') return null;
  if (
    role !== 'builder' &&
    role !== 'cold-reader' &&
    role !== 'arbiter' &&
    role !== 'pushback'
  ) {
    return null;
  }
  return {
    ts,
    run_id: runId,
    task_id: taskId,
    role,
    cost_usd: cost,
    duration_ms:
      typeof payload.duration_ms === 'number' ? payload.duration_ms : 0,
    num_turns: typeof payload.num_turns === 'number' ? payload.num_turns : 0,
    session_id:
      typeof payload.session_id === 'string' ? payload.session_id : '',
    stop_reason:
      typeof payload.stop_reason === 'string' ? payload.stop_reason : '',
    ...(typeof payload.status === 'string'
      ? { status: payload.status as DispatchLogEntry['status'] }
      : {}),
    ...(typeof payload.verdict === 'string'
      ? { verdict: payload.verdict as DispatchLogEntry['verdict'] }
      : {}),
    ...(typeof payload.findings_count === 'number'
      ? { findings_count: payload.findings_count }
      : {}),
    ...(Array.isArray(payload.findings)
      ? { findings: payload.findings as unknown[] }
      : {}),
    ...(typeof payload.commit_sha === 'string'
      ? { commit_sha: payload.commit_sha }
      : {}),
    ...(typeof payload.attempt === 'number'
      ? { attempt: payload.attempt }
      : {}),
    ...(typeof payload.parse_error === 'string'
      ? { parse_error: payload.parse_error }
      : {}),
  };
}

export function summarizeRun(state: OrchestratorState): {
  totalCostUsd: number;
  dispatchCount: number;
  amendmentCount: number;
  haltReason: string | null;
} {
  let totalCostUsd = 0;
  let dispatchCount = 0;
  let amendmentCount = 0;
  let haltReason: string | null = null;
  for (const e of state.events) {
    if (e.type === 'dispatch_end') {
      dispatchCount += 1;
      const cost = e.payload.cost_usd;
      if (typeof cost === 'number') totalCostUsd += cost;
    }
    if (e.type === 'amendment_applied') amendmentCount += 1;
    if (e.type === 'cycle_halt') {
      const reason = e.payload.reason;
      if (typeof reason === 'string') haltReason = reason;
    }
  }
  return { totalCostUsd, dispatchCount, amendmentCount, haltReason };
}

function writeStateAtomic(path: string, state: OrchestratorState): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  // node:fs renameSync is atomic on POSIX
  renameSync(tmp, path);
}

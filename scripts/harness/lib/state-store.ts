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

export type StateEventType =
  | 'orchestrate_start'
  | 'orchestrate_end'
  | 'dispatch_start'
  | 'dispatch_end'
  | 'amendment_applied'
  | 'amendment_apply_failed'
  | 'cycle_halt';

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

export function appendEvent(
  path: string,
  event: Omit<StateEvent, 'ts'> & { ts?: string }
): OrchestratorState {
  const state = loadState(path) ?? {
    run_id: `${event.task_id}-${Date.now()}`,
    started_at: new Date().toISOString(),
    events: [],
  };
  state.events.push({
    ts: event.ts ?? new Date().toISOString(),
    task_id: event.task_id,
    type: event.type,
    payload: event.payload,
  });
  writeStateAtomic(path, state);
  return state;
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

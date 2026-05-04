import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendEvent, initState, loadState, summarizeRun } from './state-store';

let workDir: string;
let statePath: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'harness-state-'));
  statePath = join(workDir, '.harness/state.json');
});

afterEach();
function afterEach() {
  // No-op placeholder — vitest auto-cleans tmp via process exit.
}

describe('state-store', () => {
  it('returns null when state file does not exist', () => {
    expect(loadState(statePath)).toBeNull();
  });

  it('initState creates the file + returns the new state', () => {
    const state = initState('T-14', statePath);
    expect(state.run_id).toMatch(/^T-14-\d+$/);
    expect(state.events).toEqual([]);
    expect(existsSync(statePath)).toBe(true);
    const reread = loadState(statePath);
    expect(reread?.run_id).toBe(state.run_id);
  });

  it('appendEvent adds events with auto-timestamp', () => {
    initState('T-14', statePath);
    appendEvent(statePath, {
      task_id: 'T-14',
      type: 'dispatch_start',
      payload: { role: 'builder' },
    });
    const s = loadState(statePath)!;
    expect(s.events).toHaveLength(1);
    expect(s.events[0]!.type).toBe('dispatch_start');
    expect(s.events[0]!.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(s.events[0]!.payload.role).toBe('builder');
  });

  it('appendEvent on missing file creates state implicitly', () => {
    appendEvent(statePath, {
      task_id: 'T-14',
      type: 'orchestrate_start',
      payload: {},
    });
    expect(loadState(statePath)?.events).toHaveLength(1);
  });

  it('writes pretty JSON to disk', () => {
    initState('T-14', statePath);
    const raw = readFileSync(statePath, 'utf8');
    expect(raw).toContain('\n');
    expect(raw).toContain('  '); // 2-space indent
  });

  it('summarizeRun aggregates cost across dispatch_end events', () => {
    initState('T-14', statePath);
    appendEvent(statePath, {
      task_id: 'T-14',
      type: 'dispatch_end',
      payload: { role: 'builder', cost_usd: 0.48, duration_ms: 128000 },
    });
    appendEvent(statePath, {
      task_id: 'T-14',
      type: 'dispatch_end',
      payload: { role: 'cold-reader', cost_usd: 0.27, duration_ms: 41000 },
    });
    const summary = summarizeRun(loadState(statePath)!);
    expect(summary.totalCostUsd).toBeCloseTo(0.75);
    expect(summary.dispatchCount).toBe(2);
    expect(summary.amendmentCount).toBe(0);
    expect(summary.haltReason).toBeNull();
  });

  it('summarizeRun counts amendments + captures halt reason', () => {
    initState('T-14', statePath);
    appendEvent(statePath, {
      task_id: 'T-14',
      type: 'amendment_applied',
      payload: { file: '02-design.md', anchor: '§D2' },
    });
    appendEvent(statePath, {
      task_id: 'T-14',
      type: 'cycle_halt',
      payload: { reason: 'retry-cap-exceeded' },
    });
    const summary = summarizeRun(loadState(statePath)!);
    expect(summary.amendmentCount).toBe(1);
    expect(summary.haltReason).toBe('retry-cap-exceeded');
  });

  it('events preserve append order', () => {
    initState('T-14', statePath);
    for (const t of ['orchestrate_start', 'dispatch_start', 'dispatch_end']) {
      appendEvent(statePath, {
        task_id: 'T-14',
        type: t as 'orchestrate_start',
        payload: {},
      });
    }
    const s = loadState(statePath)!;
    expect(s.events.map((e) => e.type)).toEqual([
      'orchestrate_start',
      'dispatch_start',
      'dispatch_end',
    ]);
  });

  it('writes dispatches.jsonl as a sibling of state.json (finding #15 regression guard)', () => {
    initState('T-28', statePath);
    appendEvent(statePath, {
      task_id: 'T-28',
      type: 'dispatch_end',
      payload: {
        role: 'builder',
        cost_usd: 0.5,
        duration_ms: 1000,
        num_turns: 5,
        session_id: 'sess-1',
        stop_reason: 'end_turn',
        status: 'success',
      },
    });
    const expectedJsonl = join(workDir, '.harness/dispatches.jsonl');
    const buggyDoubleNested = join(
      workDir,
      '.harness/.harness/dispatches.jsonl'
    );
    expect(existsSync(expectedJsonl)).toBe(true);
    expect(existsSync(buggyDoubleNested)).toBe(false);
    const lines = readFileSync(expectedJsonl, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.task_id).toBe('T-28');
    expect(parsed.role).toBe('builder');
  });

  // Cleanup helper
  it('cleanup', () => {
    rmSync(workDir, { recursive: true, force: true });
    expect(existsSync(workDir)).toBe(false);
  });
});

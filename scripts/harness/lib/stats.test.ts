import { describe, it, expect } from 'vitest';
import { computeStats, formatStatsHuman } from './stats';
import type { DispatchLogEntry } from './dispatches-log';

function entry(over: Partial<DispatchLogEntry>): DispatchLogEntry {
  return {
    ts: '2026-05-03T20:00:00.000Z',
    run_id: 'r1',
    task_id: 'T-99',
    role: 'builder',
    cost_usd: 0,
    duration_ms: 0,
    num_turns: 1,
    session_id: 's1',
    stop_reason: 'end_turn',
    ...over,
  };
}

describe('computeStats — empty + basic', () => {
  it('returns zeros for an empty log', () => {
    const r = computeStats([]);
    expect(r.overall.totalDispatches).toBe(0);
    expect(r.overall.totalCostUsd).toBe(0);
    expect(r.byRole).toEqual([]);
    expect(r.recent).toEqual([]);
  });

  it('aggregates counts, cost, duration across all roles', () => {
    const r = computeStats([
      entry({
        role: 'builder',
        cost_usd: 1.0,
        duration_ms: 60_000,
        status: 'success',
      }),
      entry({
        role: 'builder',
        cost_usd: 0.5,
        duration_ms: 30_000,
        status: 'verify_fail',
      }),
      entry({
        role: 'cold-reader',
        cost_usd: 0.27,
        duration_ms: 10_000,
        verdict: 'approve',
      }),
    ]);
    expect(r.overall.totalDispatches).toBe(3);
    expect(r.overall.totalCostUsd).toBeCloseTo(1.77);
    expect(r.byRole).toHaveLength(2);

    const builder = r.byRole.find((x) => x.role === 'builder')!;
    expect(builder.count).toBe(2);
    expect(builder.totalCostUsd).toBeCloseTo(1.5);
    expect(builder.avgCostUsd).toBeCloseTo(0.75);
    expect(builder.minCostUsd).toBe(0.5);
    expect(builder.maxCostUsd).toBe(1.0);
    expect(builder.outcomes).toEqual({ success: 1, verify_fail: 1 });
    expect(builder.successRate).toBe(0.5);

    const coldReader = r.byRole.find((x) => x.role === 'cold-reader')!;
    expect(coldReader.vetoRate).toBe(0);
  });
});

describe('computeStats — veto rate and pushback success rate', () => {
  it('cold-reader veto rate', () => {
    const r = computeStats([
      entry({ role: 'cold-reader', cost_usd: 0.2, verdict: 'veto' }),
      entry({ role: 'cold-reader', cost_usd: 0.2, verdict: 'veto' }),
      entry({ role: 'cold-reader', cost_usd: 0.2, verdict: 'approve' }),
    ]);
    const cr = r.byRole.find((x) => x.role === 'cold-reader')!;
    expect(cr.vetoRate).toBeCloseTo(2 / 3);
  });

  it('pushback success rate', () => {
    const r = computeStats([
      entry({ role: 'pushback', cost_usd: 0.7, status: 'success' }),
      entry({ role: 'pushback', cost_usd: 0.7, status: 'success' }),
      entry({ role: 'pushback', cost_usd: 0.7, status: 'verify_fail' }),
    ]);
    const pb = r.byRole.find((x) => x.role === 'pushback')!;
    expect(pb.successRate).toBeCloseTo(2 / 3);
  });
});

describe('computeStats — filters', () => {
  const fixture = [
    entry({
      task_id: 'T-1',
      role: 'builder',
      cost_usd: 1,
      ts: '2026-05-01T00:00:00Z',
    }),
    entry({
      task_id: 'T-2',
      role: 'builder',
      cost_usd: 2,
      ts: '2026-05-02T00:00:00Z',
    }),
    entry({
      task_id: 'T-2',
      role: 'cold-reader',
      cost_usd: 0.3,
      ts: '2026-05-02T00:01:00Z',
      verdict: 'approve',
    }),
  ];

  it('filters by task_id', () => {
    const r = computeStats(fixture, { taskId: 'T-2' });
    expect(r.overall.totalDispatches).toBe(2);
    expect(r.overall.totalCostUsd).toBeCloseTo(2.3);
  });

  it('filters by role', () => {
    const r = computeStats(fixture, { role: 'cold-reader' });
    expect(r.overall.totalDispatches).toBe(1);
  });

  it('filters by since', () => {
    const r = computeStats(fixture, { since: '2026-05-02T00:00:00Z' });
    expect(r.overall.totalDispatches).toBe(2);
  });
});

describe('computeStats — recent + byTask', () => {
  it('recent is sorted newest-first', () => {
    const r = computeStats(
      [
        entry({ ts: '2026-05-01T00:00:00Z', task_id: 'T-1' }),
        entry({ ts: '2026-05-03T00:00:00Z', task_id: 'T-3' }),
        entry({ ts: '2026-05-02T00:00:00Z', task_id: 'T-2' }),
      ],
      { recentLimit: 2 }
    );
    expect(r.recent.map((e) => e.task_id)).toEqual(['T-3', 'T-2']);
  });

  it('byTask groups dispatches and runs', () => {
    const r = computeStats([
      entry({ task_id: 'T-1', run_id: 'r1', cost_usd: 1 }),
      entry({ task_id: 'T-1', run_id: 'r2', cost_usd: 0.5 }),
      entry({ task_id: 'T-2', run_id: 'r3', cost_usd: 0.3 }),
    ]);
    const t1 = r.byTask!.find((t) => t.task_id === 'T-1')!;
    expect(t1.dispatches).toBe(2);
    expect(t1.totalCostUsd).toBeCloseTo(1.5);
    expect(t1.runIds.sort()).toEqual(['r1', 'r2']);
  });

  it('omits byTask when filtering to a single task', () => {
    const r = computeStats([entry({ task_id: 'T-1' })], { taskId: 'T-1' });
    expect(r.byTask).toBeUndefined();
  });
});

describe('formatStatsHuman', () => {
  it('renders a human-readable summary', () => {
    const r = computeStats([
      entry({
        role: 'builder',
        cost_usd: 1,
        duration_ms: 60_000,
        status: 'success',
      }),
      entry({
        role: 'cold-reader',
        cost_usd: 0.3,
        duration_ms: 10_000,
        verdict: 'approve',
      }),
    ]);
    const text = formatStatsHuman(r);
    expect(text).toMatch(/Harness dispatch stats/);
    expect(text).toMatch(/builder/);
    expect(text).toMatch(/cold-reader/);
    expect(text).toMatch(/success rate/);
    expect(text).toMatch(/veto rate: 0\.0%/);
  });
});

/**
 * Aggregate stats over the long-term dispatches log (Axis 5 — round 43).
 *
 * Pure functions over `DispatchLogEntry[]`. The CLI wrapper handles loading
 * the JSONL file and rendering. Useful as a library too — call directly
 * for ad-hoc analysis from a REPL or another script.
 */

import type { DispatchLogEntry } from './dispatches-log';

export interface RoleStats {
  role: DispatchLogEntry['role'];
  count: number;
  totalCostUsd: number;
  avgCostUsd: number;
  minCostUsd: number;
  maxCostUsd: number;
  totalDurationMs: number;
  avgDurationMs: number;
  /** For each verdict/status seen, count. */
  outcomes: Record<string, number>;
  /** Cold-reader: # of vetoes / # of total cold-reader dispatches. */
  vetoRate?: number;
  /** Builder: # of (success | spec_gap | verify_fail | budget_exceeded) / total. */
  successRate?: number;
}

export interface OverallStats {
  totalDispatches: number;
  totalCostUsd: number;
  totalDurationMs: number;
  parseErrorCount: number;
  /** Distinct task_ids seen. */
  uniqueTasks: number;
  /** Distinct run_ids seen. */
  uniqueRuns: number;
}

export interface StatsReport {
  overall: OverallStats;
  byRole: RoleStats[];
  /** Optional task-level rollup when filtering by task. */
  byTask?: Array<{
    task_id: string;
    dispatches: number;
    totalCostUsd: number;
    runIds: string[];
  }>;
  /** N most recent entries (for "what just happened" queries). */
  recent: DispatchLogEntry[];
}

export interface StatsFilters {
  /** Filter by exact task_id (e.g., "T-22"). */
  taskId?: string;
  /** Filter by role. */
  role?: DispatchLogEntry['role'];
  /** Inclusive lower bound on ts (ISO string). */
  since?: string;
  /** How many recent entries to surface. */
  recentLimit?: number;
}

export function computeStats(
  entries: DispatchLogEntry[],
  filters: StatsFilters = {}
): StatsReport {
  const filtered = applyFilters(entries, filters);

  const overall: OverallStats = {
    totalDispatches: filtered.length,
    totalCostUsd: sum(filtered.map((e) => e.cost_usd)),
    totalDurationMs: sum(filtered.map((e) => e.duration_ms)),
    parseErrorCount: filtered.filter((e) => e.parse_error).length,
    uniqueTasks: new Set(filtered.map((e) => e.task_id)).size,
    uniqueRuns: new Set(filtered.map((e) => e.run_id)).size,
  };

  const roles: DispatchLogEntry['role'][] = [
    'builder',
    'cold-reader',
    'arbiter',
    'pushback',
  ];
  const byRole: RoleStats[] = [];
  for (const role of roles) {
    const xs = filtered.filter((e) => e.role === role);
    if (xs.length === 0) continue;
    const costs = xs.map((e) => e.cost_usd);
    const durations = xs.map((e) => e.duration_ms);
    const outcomes: Record<string, number> = {};
    for (const e of xs) {
      const key = e.verdict ?? e.status ?? 'unknown';
      outcomes[key] = (outcomes[key] ?? 0) + 1;
    }
    const stats: RoleStats = {
      role,
      count: xs.length,
      totalCostUsd: sum(costs),
      avgCostUsd: sum(costs) / xs.length,
      minCostUsd: Math.min(...costs),
      maxCostUsd: Math.max(...costs),
      totalDurationMs: sum(durations),
      avgDurationMs: sum(durations) / xs.length,
      outcomes,
    };
    if (role === 'cold-reader') {
      const vetoes = xs.filter((e) => e.verdict === 'veto').length;
      stats.vetoRate = vetoes / xs.length;
    }
    if (role === 'builder' || role === 'pushback') {
      const successes = xs.filter((e) => e.status === 'success').length;
      stats.successRate = successes / xs.length;
    }
    byRole.push(stats);
  }

  let byTask: StatsReport['byTask'];
  if (!filters.taskId) {
    const taskMap = new Map<
      string,
      { dispatches: number; cost: number; runs: Set<string> }
    >();
    for (const e of filtered) {
      const cur = taskMap.get(e.task_id) ?? {
        dispatches: 0,
        cost: 0,
        runs: new Set<string>(),
      };
      cur.dispatches += 1;
      cur.cost += e.cost_usd;
      cur.runs.add(e.run_id);
      taskMap.set(e.task_id, cur);
    }
    byTask = Array.from(taskMap.entries())
      .map(([task_id, v]) => ({
        task_id,
        dispatches: v.dispatches,
        totalCostUsd: v.cost,
        runIds: Array.from(v.runs),
      }))
      .sort((a, b) => a.task_id.localeCompare(b.task_id));
  }

  const recent = [...filtered]
    .sort((a, b) => (a.ts < b.ts ? 1 : -1))
    .slice(0, filters.recentLimit ?? 10);

  return { overall, byRole, byTask, recent };
}

function applyFilters(
  entries: DispatchLogEntry[],
  filters: StatsFilters
): DispatchLogEntry[] {
  return entries.filter((e) => {
    if (filters.taskId && e.task_id !== filters.taskId) return false;
    if (filters.role && e.role !== filters.role) return false;
    if (filters.since && e.ts < filters.since) return false;
    return true;
  });
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

export function formatStatsHuman(report: StatsReport): string {
  const out: string[] = [];
  const o = report.overall;
  out.push('Harness dispatch stats');
  out.push(
    `  Dispatches: ${o.totalDispatches}   Tasks: ${o.uniqueTasks}   Runs: ${o.uniqueRuns}   Parse errors: ${o.parseErrorCount}`
  );
  out.push(
    `  Total cost: $${o.totalCostUsd.toFixed(4)}   Total duration: ${formatDuration(o.totalDurationMs)}`
  );
  out.push('');
  out.push('Per role:');
  for (const r of report.byRole) {
    out.push(`  ${r.role.padEnd(12)} ×${r.count}`);
    out.push(
      `    cost  total $${r.totalCostUsd.toFixed(4)}  avg $${r.avgCostUsd.toFixed(4)}  min $${r.minCostUsd.toFixed(4)}  max $${r.maxCostUsd.toFixed(4)}`
    );
    out.push(
      `    time  total ${formatDuration(r.totalDurationMs)}  avg ${formatDuration(r.avgDurationMs)}`
    );
    const outcomeStr = Object.entries(r.outcomes)
      .map(([k, v]) => `${k}=${v}`)
      .join('  ');
    if (outcomeStr) out.push(`    outcomes: ${outcomeStr}`);
    if (r.vetoRate !== undefined) {
      out.push(`    veto rate: ${(r.vetoRate * 100).toFixed(1)}%`);
    }
    if (r.successRate !== undefined) {
      out.push(`    success rate: ${(r.successRate * 100).toFixed(1)}%`);
    }
  }
  if (report.byTask && report.byTask.length > 0) {
    out.push('');
    out.push('Per task:');
    for (const t of report.byTask) {
      out.push(
        `  ${t.task_id.padEnd(8)} ×${t.dispatches} dispatches across ${t.runIds.length} run(s)  $${t.totalCostUsd.toFixed(4)}`
      );
    }
  }
  out.push('');
  out.push(`Most recent ${report.recent.length}:`);
  for (const e of report.recent) {
    const verdict = e.verdict ?? e.status ?? '-';
    out.push(
      `  ${e.ts}  ${e.task_id.padEnd(8)} ${e.role.padEnd(12)} ${verdict.padEnd(16)} $${e.cost_usd.toFixed(4)}`
    );
  }
  return out.join('\n');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rs = s - m * 60;
  return `${m}m${rs.toFixed(0).padStart(2, '0')}s`;
}

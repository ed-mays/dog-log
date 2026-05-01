/**
 * Read-only orchestration logic for the spec-anchored harness.
 *
 * MVP step 2: parses a task list, computes status summaries, and returns the
 * next actionable task. No agent dispatch, no state mutation, no I/O beyond
 * what the caller hands in. The CLI wrapper is responsible for reading the
 * file from disk and printing results.
 *
 * Pure: takes a task-list markdown string, returns typed results. No project
 * imports — extraction-ready for the future spec-scaffolder tool.
 */

import {
  nextActionableTask,
  parseTaskList,
  type ParsedTaskList,
  type Task,
  type TaskStatus,
} from './task-parser';

export interface SliceProgress {
  index: number;
  name: string;
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  pending: number;
  /** True when every task in the slice is `done`. */
  complete: boolean;
}

export interface StatusSummary {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  pending: number;
  slices: SliceProgress[];
  openDqs: ParsedTaskList['openDqs'];
  warnings: string[];
}

export interface NextTaskReport {
  /**
   * The task to dispatch next, or `null` if none are actionable. A task is
   * actionable iff its own status is `pending` AND every prior task in its
   * own slice is `done`.
   */
  task: Task | null;
  /**
   * Set when `task` is non-null AND the slice that task belongs to has *no*
   * tasks yet completed. The controller should halt and prompt the human for
   * a slice-boundary smoke before dispatching, even though the task itself
   * is structurally ready. (Slice 0 is exempt — no prior slice to smoke.)
   */
  atSliceBoundary: boolean;
  /** The slice that `task` belongs to, or null. */
  slice: SliceProgress | null;
  /** Surfaced for the caller; same as `parsed.warnings`. */
  warnings: string[];
}

/**
 * Loads the task list and produces a status summary suitable for `harness
 * status` output.
 */
export function loadStatus(markdown: string): StatusSummary {
  const parsed = parseTaskList(markdown);
  return summarize(parsed);
}

/**
 * Loads the task list and identifies the next task to dispatch, including
 * whether the controller should halt at a slice boundary first.
 */
export function loadNext(markdown: string): NextTaskReport {
  const parsed = parseTaskList(markdown);
  const task = nextActionableTask(parsed);

  if (!task) {
    return {
      task: null,
      atSliceBoundary: false,
      slice: null,
      warnings: parsed.warnings,
    };
  }

  const summary = summarize(parsed);
  const slice = summary.slices.find((s) => s.index === task.slice) ?? null;

  // Slice-boundary heuristic: we're at a boundary iff the task is the FIRST
  // pending task in its slice AND its slice has no `done` tasks yet AND the
  // slice index > 0. Slice 0 is foundation — no prior slice to smoke.
  const atSliceBoundary =
    task.slice > 0 &&
    !!slice &&
    slice.done === 0 &&
    isFirstPendingInSlice(parsed, task);

  return { task, atSliceBoundary, slice, warnings: parsed.warnings };
}

function isFirstPendingInSlice(parsed: ParsedTaskList, task: Task): boolean {
  for (const t of parsed.tasks) {
    if (t.slice !== task.slice) continue;
    if (t.id === task.id) return true;
    // If we encounter any same-slice task before this one that isn't `done`,
    // then this task isn't the first pending — it's just the first actionable.
    if (t.status !== 'done') return false;
  }
  return false;
}

function summarize(parsed: ParsedTaskList): StatusSummary {
  const slicesById = new Map<number, SliceProgress>();
  for (const slice of parsed.slices) {
    slicesById.set(slice.index, {
      index: slice.index,
      name: slice.name,
      total: 0,
      done: 0,
      inProgress: 0,
      blocked: 0,
      pending: 0,
      complete: false,
    });
  }

  let total = 0;
  const counts: Record<TaskStatus, number> = {
    pending: 0,
    in_progress: 0,
    done: 0,
    blocked: 0,
  };

  for (const task of parsed.tasks) {
    total += 1;
    counts[task.status] += 1;
    const sp = slicesById.get(task.slice);
    if (!sp) continue;
    sp.total += 1;
    switch (task.status) {
      case 'pending':
        sp.pending += 1;
        break;
      case 'in_progress':
        sp.inProgress += 1;
        break;
      case 'done':
        sp.done += 1;
        break;
      case 'blocked':
        sp.blocked += 1;
        break;
    }
  }
  for (const sp of slicesById.values()) {
    sp.complete = sp.total > 0 && sp.done === sp.total;
  }

  return {
    total,
    done: counts.done,
    inProgress: counts.in_progress,
    blocked: counts.blocked,
    pending: counts.pending,
    slices: Array.from(slicesById.values()).sort((a, b) => a.index - b.index),
    openDqs: parsed.openDqs,
    warnings: parsed.warnings,
  };
}

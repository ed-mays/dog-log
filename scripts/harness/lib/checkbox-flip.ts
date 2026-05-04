/**
 * Pure markdown transform: flip a task's `[ ]` checkbox to `[x]` in
 * `03-tasks.md` style task lists.
 *
 * Wired into the orchestrator success path so the post-merge step doesn't
 * rely on operator memory (T-27 round 43, T-28 round 45, T-29 round 46
 * all required manual checkbox flips — round-43 lesson 2nd recurrence
 * escalated to ship-now in round 47).
 *
 * Pure: takes a string + task id, returns a typed result. No I/O, no
 * project imports — same shape as task-parser, citation-linter, etc.
 */

export interface FlipResult {
  /** New markdown (unchanged when `flipped` is false). */
  markdown: string;
  /** True iff a `[ ]` → `[x]` substitution was applied. */
  flipped: boolean;
  /** Explanation when `flipped` is false (already-[x], blocked, not-found). */
  reason?: string;
}

/**
 * Match a task heading like `### \`[ ]\` T-28 — description`. The `[ ]`
 * may have extra whitespace inside the backticks. Status char captured.
 */
function buildHeadingRe(taskId: string): RegExp {
  // Escape the task id (T-28 is regex-safe, but be defensive).
  const escaped = taskId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `^(###\\s+\`\\[)([\\sx!~])(\\]\`\\s+${escaped}\\b.*)$`,
    'm'
  );
}

export function flipTaskCheckbox(markdown: string, taskId: string): FlipResult {
  const re = buildHeadingRe(taskId);
  const match = markdown.match(re);
  if (!match) {
    return {
      markdown,
      flipped: false,
      reason: `task ${taskId} not found in markdown`,
    };
  }
  const status = match[2];
  if (status === 'x') {
    return {
      markdown,
      flipped: false,
      reason: `task ${taskId} is already [x]`,
    };
  }
  if (status === '!') {
    return {
      markdown,
      flipped: false,
      reason: `task ${taskId} is [!] (blocked) — refusing to override`,
    };
  }
  const updated = markdown.replace(re, '$1x$3');
  return { markdown: updated, flipped: true };
}

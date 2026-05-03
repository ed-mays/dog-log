/**
 * Assembles the per-task structured input that the cold-reader agent
 * receives. Distinct from `BuilderInput` because the cold-reader needs the
 * DIFF (and only the diff plus filtered cites) — not the project-convention
 * context files the builder uses.
 *
 * Pure: takes a Task, the diff string, and already-loaded markdown.
 * The CLI wrapper handles git/file I/O.
 */

import { extractRequirement, extractSpecSection } from './spec-parser';
import type { Citation, Task } from './task-parser';

export interface ColdReaderInput {
  task_id: string;
  task_description: string;
  /** The verbatim "What" line from the task body. Per finding #6 (round 37,
   * widened round 39): cold-reader needs this to evaluate scope_check 7
   * (does the diff implement every method/symbol/file named here, with the
   * exact names given). Without this, scope #1 only sees BR coverage at the
   * spec level, which is too loose. */
  task_what: string | null;
  /** Per-spec methodology: the cold-reader sees verbatim cited regions only,
   * not the full spec/design. The flat list keeps the prompt deterministic. */
  cited_spec_sections: Array<{ ref: string; body: string }>;
  cited_design_sections: Array<{ ref: string; body: string }>;
  /** The Verify line from the task. */
  verify_line: string | null;
  /** The full diff the cold-reader is examining. */
  diff: string;
  /** Files touched by the diff, parsed from the diff header lines. */
  changed_files: string[];
  /** Refs the task cited that we couldn't extract — same surfacing pattern as BuilderInput. */
  missing_citations: string[];
}

export interface BuildColdReaderInputOptions {
  task: Task;
  specMarkdown: string;
  designMarkdown: string;
  /** Raw `git diff` output. */
  diff: string;
}

/**
 * Build a ColdReaderInput from a parsed Task plus diff + spec/design markdown.
 */
export function buildColdReaderInput(
  opts: BuildColdReaderInputOptions
): ColdReaderInput {
  const { task, specMarkdown, designMarkdown, diff } = opts;

  const specCites: Array<{ ref: string; body: string }> = [];
  const designCites: Array<{ ref: string; body: string }> = [];
  const missing: string[] = [];

  for (const cite of task.citations.spec) {
    const body = resolveCitationBody(cite, specMarkdown);
    if (body !== null) specCites.push({ ref: cite.ref, body });
    else missing.push(cite.ref);
  }
  for (const cite of task.citations.design) {
    const body = resolveCitationBody(cite, designMarkdown);
    if (body !== null) designCites.push({ ref: cite.ref, body });
    else missing.push(cite.ref);
  }

  return {
    task_id: task.id,
    task_description: task.description,
    task_what: task.what,
    cited_spec_sections: specCites,
    cited_design_sections: designCites,
    verify_line: task.verify,
    diff,
    changed_files: extractChangedFiles(diff),
    missing_citations: missing,
  };
}

function resolveCitationBody(cite: Citation, markdown: string): string | null {
  if (cite.kind === 'spec_section' || cite.kind === 'design_section') {
    return extractSpecSection(markdown, cite.ref);
  }
  return extractRequirement(markdown, cite.ref);
}

/**
 * Parses unified diff headers (`diff --git a/<path> b/<path>`) to extract the
 * touched file list. Returns dedupes paths. Robust to empty diffs.
 */
export function extractChangedFiles(diff: string): string[] {
  const set = new Set<string>();
  const re = /^diff --git a\/(\S+) b\/(\S+)/gm;
  for (const m of diff.matchAll(re)) {
    // Use the b/ side — that's the post-change path (matters for renames).
    set.add(m[2] ?? m[1]!);
  }
  return Array.from(set).sort();
}

/**
 * Render a ColdReaderInput as a markdown blob ready to drop into a prompt.
 * The system prompt (cold-reader-code.md) goes ABOVE this; the structured
 * input is the per-task payload.
 */
export function formatColdReaderInputMarkdown(input: ColdReaderInput): string {
  const out: string[] = [];
  out.push(`# Task under review: ${input.task_id} — ${input.task_description}`);
  out.push('');

  if (input.missing_citations.length > 0) {
    out.push(
      '> ⚠ The following citations on the task could not be resolved against'
    );
    out.push(
      "> the source artifacts. The producer didn't have them either; treat their"
    );
    out.push(
      '> absence as part of the structural picture, not a producer fault:'
    );
    for (const m of input.missing_citations) out.push(`> - ${m}`);
    out.push('');
  }

  if (input.verify_line) {
    out.push(`**Verify line (per-task gate):** ${input.verify_line}`);
    out.push('');
  }

  if (input.task_what) {
    out.push('## Task contract (verbatim "What" line)');
    out.push('');
    out.push(
      "_The 'What' line is the verbatim contract for this task. Treat every"
    );
    out.push(
      'method/symbol/file/option named here as a verbatim requirement; renaming,'
    );
    out.push(
      'collapsing, or omitting any named entity is a divergence (see scope_check 7)._'
    );
    out.push('');
    out.push(input.task_what.trim());
    out.push('');
  }

  out.push('## Cited spec sections');
  out.push('');
  if (input.cited_spec_sections.length === 0) {
    out.push('_(none)_');
    out.push('');
  } else {
    for (const c of input.cited_spec_sections) {
      out.push(`### ${c.ref}`);
      out.push('');
      out.push(c.body);
      out.push('');
    }
  }

  out.push('## Cited design sections');
  out.push('');
  if (input.cited_design_sections.length === 0) {
    out.push('_(none)_');
    out.push('');
  } else {
    for (const c of input.cited_design_sections) {
      out.push(`### ${c.ref}`);
      out.push('');
      out.push(c.body);
      out.push('');
    }
  }

  out.push('## Changed files');
  out.push('');
  if (input.changed_files.length === 0) {
    out.push('_(none — empty diff)_');
  } else {
    for (const f of input.changed_files) out.push(`- \`${f}\``);
  }
  out.push('');

  out.push('## Diff');
  out.push('');
  out.push('```diff');
  out.push(input.diff.trimEnd());
  out.push('```');

  return out.join('\n');
}

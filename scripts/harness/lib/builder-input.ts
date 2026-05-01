/**
 * Assembles the per-task structured input that the builder agent receives.
 *
 * Pure: takes a Task plus already-loaded markdown strings, returns a typed
 * BuilderInput. The CLI wrapper handles file I/O.
 */

import {
  extractRequirement,
  extractSpecSection,
  type SpecParserOptions,
} from './spec-parser';
import type { Citation, Task } from './task-parser';

export interface BuilderInputBudget {
  /** Approximate token budget for the agent's invocation. */
  tokens: number;
  /** Wall-clock cap before the controller force-exits. */
  wallClockMinutes: number;
  /** How many times the controller will retry a `verify_fail` before escalating. */
  retries: number;
}

export const DEFAULT_BUDGET: BuilderInputBudget = {
  tokens: 100_000,
  wallClockMinutes: 15,
  retries: 2,
};

export interface ExtractedCitation {
  /** The citation token, e.g. 'BR-7' or '§D3'. */
  ref: string;
  /** Verbatim text from the source artifact. */
  body: string;
  /** Where it came from. */
  source: 'spec' | 'design';
  /** True when extraction returned null and we surfaced the ref as missing. */
  missing?: true;
}

export interface BuilderInput {
  task_id: string;
  description: string;
  slice: number;
  slice_name: string;
  citations: ExtractedCitation[];
  verify: string | null;
  notes: string | null;
  dq_tags: string[];
  /** Files the agent should read for project conventions. Caller-supplied. */
  context_files: string[];
  /**
   * Files the agent is permitted to create or modify. Currently caller-supplied;
   * future controller will derive from design §D2 file map.
   */
  allowed_writes: string[];
  budget: BuilderInputBudget;
  /**
   * Refs that were cited by the task but not found in the source artifact.
   * The controller treats this as a structural error worth surfacing before
   * dispatch — the agent can't satisfy citations that don't exist.
   */
  missing_citations: string[];
}

export interface BuildBuilderInputOptions {
  task: Task;
  specMarkdown: string;
  designMarkdown: string;
  contextFiles?: string[];
  allowedWrites?: string[];
  budget?: BuilderInputBudget;
}

/**
 * Build a BuilderInput from a parsed Task plus the spec/design markdown.
 *
 * The function tries each citation in two ways:
 *   - For section refs (`§N`, `§DN`): extract the whole section.
 *   - For typed refs (`BR-N`, `AC-N`, etc.): extract the bullet.
 *
 * Citations that don't resolve are surfaced via `missing_citations` rather
 * than thrown — this lets the caller decide whether to dispatch a partial
 * input or halt.
 */
export function buildBuilderInput(
  opts: BuildBuilderInputOptions
): BuilderInput {
  const {
    task,
    specMarkdown,
    designMarkdown,
    contextFiles = ['CLAUDE.md'],
    allowedWrites = [],
    budget = DEFAULT_BUDGET,
  } = opts;

  const citations: ExtractedCitation[] = [];
  const missing: string[] = [];

  for (const cite of task.citations.spec) {
    const ext = resolveCitation(cite, specMarkdown, 'spec');
    if (ext) citations.push(ext);
    else missing.push(cite.ref);
  }
  for (const cite of task.citations.design) {
    const ext = resolveCitation(cite, designMarkdown, 'design');
    if (ext) citations.push(ext);
    else missing.push(cite.ref);
  }

  return {
    task_id: task.id,
    description: task.description,
    slice: task.slice,
    slice_name: task.sliceName,
    citations,
    verify: task.verify,
    notes: task.notes,
    dq_tags: task.dqTags,
    context_files: contextFiles,
    allowed_writes: allowedWrites,
    budget,
    missing_citations: missing,
  };
}

function resolveCitation(
  cite: Citation,
  markdown: string,
  source: 'spec' | 'design'
): ExtractedCitation | null {
  const opts: SpecParserOptions = { required: false };

  // Section refs (§N or §DN) → extract the whole section.
  if (cite.kind === 'spec_section' || cite.kind === 'design_section') {
    const body = extractSpecSection(markdown, cite.ref, opts);
    if (body === null) return null;
    return { ref: cite.ref, body, source };
  }

  // Typed refs (BR-N, AC-N, NFR-N, US-N, OQ-N, DQ-N) → extract the bullet.
  const body = extractRequirement(markdown, cite.ref, opts);
  if (body === null) return null;
  return { ref: cite.ref, body, source };
}

/**
 * Render a BuilderInput as a human-readable / agent-readable markdown blob,
 * ready to drop into a prompt. The system prompt (builder.md) goes ABOVE
 * this; the structured input is the task-specific payload.
 */
export function formatBuilderInputMarkdown(input: BuilderInput): string {
  const out: string[] = [];
  out.push(`# Task: ${input.task_id} — ${input.description}`);
  out.push('');
  out.push(`**Slice:** ${input.slice} (${input.slice_name})`);
  if (input.dq_tags.length > 0) {
    out.push(`**Open DQ tags:** ${input.dq_tags.join(', ')}`);
  }

  if (input.missing_citations.length > 0) {
    out.push('');
    out.push('> ⚠ The following citations were not found in the source');
    out.push('> artifacts. Treat as a structural problem and prefer a');
    out.push('> `spec_gap` exit over guessing:');
    for (const m of input.missing_citations) out.push(`> - ${m}`);
  }

  out.push('');
  out.push('## Cited spec/design context');
  out.push('');
  for (const c of input.citations) {
    out.push(`### ${c.ref} (${c.source})`);
    out.push('');
    out.push(c.body);
    out.push('');
  }

  if (input.verify) {
    out.push('## Verify (the per-task gate)');
    out.push('');
    out.push(input.verify);
    out.push('');
  }

  if (input.notes) {
    out.push('## Notes');
    out.push('');
    out.push(input.notes);
    out.push('');
  }

  out.push('## Project context files');
  out.push('');
  out.push('Read these for project conventions:');
  for (const f of input.context_files) out.push(`- \`${f}\``);
  out.push('');

  if (input.allowed_writes.length > 0) {
    out.push('## Files you may create or modify');
    out.push('');
    for (const w of input.allowed_writes) out.push(`- \`${w}\``);
    out.push('');
  } else {
    out.push('## Files you may create or modify');
    out.push('');
    out.push(
      '_None pre-specified. Derive from the cited design §D2 file map and stage only those._'
    );
    out.push('');
  }

  out.push('## Budget');
  out.push('');
  out.push(`- tokens: ~${input.budget.tokens.toLocaleString()}`);
  out.push(`- wall clock: ${input.budget.wallClockMinutes} min`);
  out.push(`- retries on verify_fail: ${input.budget.retries}`);

  return out.join('\n');
}

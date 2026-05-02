/**
 * Assembles the per-arbitration structured input that the drift-arbiter agent
 * receives. The arbiter resolves a `spec_gap` exit from the builder by proposing
 * a minimal amendment to spec / design / task — or a pushback when the builder
 * misread the spec.
 *
 * Pure: takes a spec_gap payload + already-loaded markdown strings, returns a
 * typed DriftArbiterInput. The CLI wrapper handles file I/O.
 *
 * Sibling to `BuilderInput` and `ColdReaderInput`; shares the same shape
 * conventions (typed interface, format helper, missing-citation surfacing).
 */

import { extractRequirement, extractSpecSection } from './spec-parser';
import { parseTaskList, type Task } from './task-parser';

/**
 * The builder's `spec_gap` payload. Mirrors the YAML schema in the builder
 * system prompt's output contract.
 *
 * `cited_section` is `string | string[]` per round-16 schema generalization
 * (a gap may genuinely span multiple sections).
 */
export interface SpecGapPayload {
  task_id: string;
  /** Section(s) the builder thought governed this task. */
  cited_section: string | string[];
  /** Builder's prose description of the gap. */
  gap_description: string;
  /** Optional builder proposal — may include alternatives. Treated as a starting point. */
  suggested_amendment?: string;
  /** Files the builder read while discovering the gap. */
  files_inspected?: string[];
}

export interface ArbiterCitedExcerpt {
  ref: string;
  body: string;
  source: 'spec' | 'design';
}

export interface DriftArbiterInput {
  spec_gap: SpecGapPayload;
  /** The full task entry from the task list, parsed. */
  task: Task | null;
  /** Verbatim excerpts of the cited spec/design sections. */
  cited_artifact_excerpts: ArbiterCitedExcerpt[];
  /** Recent §10 changelog entries from the spec. */
  recent_spec_changelog: string;
  /** Recent §D11 changelog entries from the design. */
  recent_design_changelog: string;
  /** Recent §T10 changelog entries from the task list, if any. */
  recent_task_changelog: string;
  /**
   * Controller-tracked count of arbitrations already applied to this task.
   * The MVP CLI passes 0 unless overridden via flag.
   */
  prior_arbitrations_for_this_task: number;
  /** Refs the builder cited that we couldn't extract from spec/design. */
  missing_citations: string[];
}

export interface BuildDriftArbiterInputOptions {
  spec_gap: SpecGapPayload;
  specMarkdown: string;
  designMarkdown: string;
  tasksMarkdown: string;
  priorArbitrations?: number;
}

/** Section heading patterns used to locate changelogs. The methodology says
 *  changelogs live at `## §10`, `## §D11`, `## §T0` (per task-list convention). */
const SPEC_CHANGELOG_HEADING = /^## §10\b/m;
const DESIGN_CHANGELOG_HEADING = /^## §D11\b/m;
const TASK_CHANGELOG_HEADING = /^## §T\d+\b/m;

/** How many recent changelog entries to extract from each artifact. */
const RECENT_CHANGELOG_ENTRIES = 5;

export function buildDriftArbiterInput(
  opts: BuildDriftArbiterInputOptions
): DriftArbiterInput {
  const {
    spec_gap,
    specMarkdown,
    designMarkdown,
    tasksMarkdown,
    priorArbitrations = 0,
  } = opts;

  const cited = normalizeCitedSections(spec_gap.cited_section);
  const cited_artifact_excerpts: ArbiterCitedExcerpt[] = [];
  const missing: string[] = [];

  for (const ref of cited) {
    const excerpt = resolveExcerpt(ref, specMarkdown, designMarkdown);
    if (excerpt) cited_artifact_excerpts.push(excerpt);
    else missing.push(ref);
  }

  const parsed = parseTaskList(tasksMarkdown);
  const task = parsed.tasks.find((t) => t.id === spec_gap.task_id) ?? null;

  return {
    spec_gap,
    task,
    cited_artifact_excerpts,
    recent_spec_changelog: extractRecentChangelog(
      specMarkdown,
      SPEC_CHANGELOG_HEADING
    ),
    recent_design_changelog: extractRecentChangelog(
      designMarkdown,
      DESIGN_CHANGELOG_HEADING
    ),
    recent_task_changelog: extractRecentChangelog(
      tasksMarkdown,
      TASK_CHANGELOG_HEADING
    ),
    prior_arbitrations_for_this_task: priorArbitrations,
    missing_citations: missing,
  };
}

/**
 * Splits a compound `cited_section` value into individual refs that point at
 * spec/design content (not task refs).
 *
 * Round-18's spec_gap had `cited_section: "§D3 (design); Verify line for T-01"`
 * — a compound string mixing a stable ref with a free-text descriptor. We
 * extract anything that matches the citation grammar and discard the rest;
 * the builder's prose still appears in `gap_description`.
 *
 * **`T-N` refs are deliberately NOT extracted here.** The arbiter receives
 * the relevant task entry separately via `spec_gap.task_id` + the parsed
 * task list. A `T-N` appearing inside `cited_section` prose (like the
 * round-18 case "Verify line for T-01") is contextual, not a true citation
 * — extracting it would create a phantom missing-citation warning since
 * task entries don't live in `01-spec.md` or `02-design.md`.
 */
export function normalizeCitedSections(raw: string | string[]): string[] {
  const items = Array.isArray(raw) ? raw : [raw];
  const found = new Set<string>();
  const tokenRe = /\b(?:BR|NFR|AC|US|OQ|DQ)-\d+\b/g;
  const sectionRe = /§D?\d+\b/g;
  for (const item of items) {
    for (const m of item.matchAll(tokenRe)) found.add(m[0]);
    for (const m of item.matchAll(sectionRe)) found.add(m[0]);
  }
  return Array.from(found);
}

function resolveExcerpt(
  ref: string,
  specMarkdown: string,
  designMarkdown: string
): ArbiterCitedExcerpt | null {
  // Section refs: §N → spec, §DN → design.
  if (ref.startsWith('§D')) {
    const body = extractSpecSection(designMarkdown, ref);
    return body ? { ref, body, source: 'design' } : null;
  }
  if (ref.startsWith('§')) {
    const body = extractSpecSection(specMarkdown, ref);
    return body ? { ref, body, source: 'spec' } : null;
  }
  // Typed refs: try spec first, then design (BRs / ACs typically live in spec
  // but DQs live in design).
  const fromSpec = extractRequirement(specMarkdown, ref);
  if (fromSpec) return { ref, body: fromSpec, source: 'spec' };
  const fromDesign = extractRequirement(designMarkdown, ref);
  if (fromDesign) return { ref, body: fromDesign, source: 'design' };
  return null;
}

/**
 * Extracts the most recent N changelog bullets from the section identified by
 * `headingRe`. Each entry begins with a top-level `-` bullet under the
 * changelog heading. Returns up to `RECENT_CHANGELOG_ENTRIES` newest entries
 * (assumed to be at the bottom of the section per the methodology's
 * append-only changelog convention).
 */
function extractRecentChangelog(markdown: string, headingRe: RegExp): string {
  const match = headingRe.exec(markdown);
  if (!match) return '';
  const startIdx = match.index;
  const after = markdown.slice(startIdx);
  const nextHeadingMatch = /\n## /.exec(after.slice(1));
  const sectionEnd = nextHeadingMatch
    ? 1 + nextHeadingMatch.index
    : after.length;
  const sectionBody = after.slice(0, sectionEnd);

  // Pull top-level bullets from this section (lines starting with "- ").
  const bullets: string[] = [];
  const lines = sectionBody.split('\n');
  let current: string[] = [];
  for (const line of lines) {
    if (/^- /.test(line)) {
      if (current.length > 0) bullets.push(current.join('\n'));
      current = [line];
    } else if (
      current.length > 0 &&
      (line.startsWith(' ') || line.trim() === '')
    ) {
      current.push(line);
    } else if (current.length > 0) {
      bullets.push(current.join('\n'));
      current = [];
    }
  }
  if (current.length > 0) bullets.push(current.join('\n'));

  const trimmed = bullets.map((b) => b.trimEnd()).filter(Boolean);
  return trimmed.slice(-RECENT_CHANGELOG_ENTRIES).join('\n\n');
}

/**
 * Render a DriftArbiterInput as a markdown blob ready to drop into a prompt.
 * The system prompt (drift-arbiter.md) goes ABOVE this; the structured input
 * is the per-arbitration payload.
 */
export function formatDriftArbiterInputMarkdown(
  input: DriftArbiterInput
): string {
  const out: string[] = [];
  const { spec_gap, task } = input;

  out.push(`# Arbitration request — ${spec_gap.task_id}`);
  out.push('');

  if (input.prior_arbitrations_for_this_task > 0) {
    out.push(
      `> ⚠ **Prior arbitrations on this task: ${input.prior_arbitrations_for_this_task}.** ` +
        'Bias toward `pushback` rather than another amendment unless the gap is genuinely new.'
    );
    out.push('');
  }

  if (input.missing_citations.length > 0) {
    out.push(
      "> ⚠ The following refs in the builder's `cited_section` could not be resolved against spec/design."
    );
    out.push('> Treat as part of the picture:');
    for (const m of input.missing_citations) out.push(`> - ${m}`);
    out.push('');
  }

  out.push('## Builder spec_gap payload');
  out.push('');
  out.push(`- **task_id:** ${spec_gap.task_id}`);
  out.push(
    `- **cited_section:** ${
      Array.isArray(spec_gap.cited_section)
        ? spec_gap.cited_section.join('; ')
        : spec_gap.cited_section
    }`
  );
  out.push('');
  out.push('### Gap description');
  out.push('');
  out.push(spec_gap.gap_description);
  out.push('');
  if (spec_gap.suggested_amendment) {
    out.push('### Builder-suggested amendment (treat as starting point)');
    out.push('');
    out.push(spec_gap.suggested_amendment);
    out.push('');
  }
  if (spec_gap.files_inspected && spec_gap.files_inspected.length > 0) {
    out.push('### Files the builder inspected');
    out.push('');
    for (const f of spec_gap.files_inspected) out.push(`- \`${f}\``);
    out.push('');
  }

  out.push('## Task entry (from `03-tasks.md`)');
  out.push('');
  if (!task) {
    out.push(
      `_(task ${spec_gap.task_id} not found in the parsed task list — propose a pushback)_`
    );
  } else {
    out.push(
      `**${task.id}** — ${task.description}  (slice ${task.slice}: ${task.sliceName}, status: ${task.status})`
    );
    if (task.what) {
      out.push('');
      out.push('**What:**');
      out.push('');
      out.push(task.what);
    }
    if (task.verify) {
      out.push('');
      out.push(`**Verify:** ${task.verify}`);
    }
    if (task.notes) {
      out.push('');
      out.push('**Notes:**');
      out.push('');
      out.push(task.notes);
    }
  }
  out.push('');

  out.push('## Cited artifact excerpts');
  out.push('');
  if (input.cited_artifact_excerpts.length === 0) {
    out.push('_(none — every cited ref was unresolvable; see warning above)_');
    out.push('');
  } else {
    for (const c of input.cited_artifact_excerpts) {
      out.push(`### ${c.ref} (${c.source})`);
      out.push('');
      out.push(c.body);
      out.push('');
    }
  }

  out.push('## Recent changelog context');
  out.push('');
  pushChangelogBlock(out, 'Spec §10', input.recent_spec_changelog);
  pushChangelogBlock(out, 'Design §D11', input.recent_design_changelog);
  pushChangelogBlock(out, 'Task list (T0)', input.recent_task_changelog);

  return out.join('\n');
}

function pushChangelogBlock(out: string[], label: string, body: string): void {
  out.push(`### ${label}`);
  out.push('');
  if (body.trim().length === 0) {
    out.push('_(no recent entries)_');
  } else {
    out.push(body);
  }
  out.push('');
}

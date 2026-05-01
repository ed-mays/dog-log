/**
 * Parses a spec-anchored task list (e.g. `docs/specs/<feature>/03-tasks.md`)
 * into a structured form the harness controller can drive.
 *
 * Pure: takes a markdown string, returns a typed result. No I/O, no project
 * imports — extraction-ready for the future spec-scaffolder tool.
 */

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

export type CitationKind =
  | 'BR'
  | 'NFR'
  | 'AC'
  | 'US'
  | 'OQ'
  | 'DQ'
  | 'spec_section' // §N (with no D prefix)
  | 'design_section'; // §DN

export interface Citation {
  kind: CitationKind;
  /** The full reference token, e.g. 'BR-7', '§5', '§D3', 'DQ-4'. */
  ref: string;
}

export interface Task {
  /** e.g. 'T-01' */
  id: string;
  /** Numeric position in the list, useful for ordering. */
  index: number;
  status: TaskStatus;
  /** Description text after the em-dash in the heading. */
  description: string;
  /** Slice the task belongs to (0-indexed; matches `## Slice N`). */
  slice: number;
  sliceName: string;
  citations: {
    spec: Citation[];
    design: Citation[];
  };
  /** Verbatim `**What:**` body if present. */
  what: string | null;
  /** Verbatim `**Verify:**` body. Required by methodology — null only if malformed. */
  verify: string | null;
  /** Verbatim `**Notes:**` body if present. */
  notes: string | null;
  /** Distinct DQ tags found in `notes`, e.g. ['DQ-4']. */
  dqTags: string[];
}

export interface OpenDQ {
  id: string; // e.g. 'DQ-4'
  /** Free-text body of the entry. */
  description: string;
}

export interface SliceSummary {
  index: number;
  name: string;
  taskIds: string[];
}

export interface ParsedTaskList {
  tasks: Task[];
  slices: SliceSummary[];
  openDqs: OpenDQ[];
  /** Any structural issues the parser noticed but recovered from. */
  warnings: string[];
}

const STATUS_MAP: Record<string, TaskStatus> = {
  ' ': 'pending',
  '~': 'in_progress',
  x: 'done',
  X: 'done',
  '!': 'blocked',
};

/** `## Slice 0 — Foundation` (em-dash or hyphen). */
const SLICE_HEADING = /^##\s+Slice\s+(\d+)\s+[—\-–]\s+(.+?)\s*$/;

/** Matches a task heading like ``### `[ ]` T-01 — TypeScript types``. */
const TASK_HEADING = /^###\s+`\[(.)\]`\s+(T-\d+)\s+[—\-–]\s+(.+?)\s*$/;

/** Open DQ list entry, e.g. `- **DQ-4** journal commit cadence — using ...`. */
const OPEN_DQ_LINE = /^-\s+\*\*(DQ-\d+)\*\*\s+(.+?)\s*$/;

/** Field bullets within a task block: `- **Cite:** ...`, `- **What:** ...`. */
const FIELD_LINE = /^-\s+\*\*(Cite|What|Verify|Notes):\*\*\s+(.*)$/;

/** Citations like `BR-7`, `NFR-1`, `AC-12`, `US-3`, `OQ-2`, `DQ-4`. */
const TOKEN_CITATION = /\b(BR|NFR|AC|US|OQ|DQ)-(\d+)\b/g;

/** Section refs: `§5` (spec) or `§D3` (design). */
const SECTION_CITATION = /§(D?)(\d+)\b/g;

/**
 * Parses a tasks markdown file into a structured form.
 *
 * Tolerates extra prose between elements; ignores anything that isn't
 * recognized as a slice heading, task heading, or field bullet.
 */
export function parseTaskList(markdown: string): ParsedTaskList {
  const lines = markdown.split('\n');
  const warnings: string[] = [];
  const tasks: Task[] = [];
  const slices: SliceSummary[] = [];
  const openDqs: OpenDQ[] = [];

  let currentSliceIndex = -1;
  let currentSliceName = '';
  let inOpenDqsBlock = false;
  let taskCounter = 0;

  // Per-task accumulators
  let pendingTask: Task | null = null;
  let pendingFieldName: 'cite' | 'what' | 'verify' | 'notes' | null = null;
  let pendingFieldBuffer: string[] = [];

  function flushField(): void {
    if (!pendingTask || !pendingFieldName) return;
    const value = pendingFieldBuffer.join('\n').trim();
    if (!value) {
      pendingFieldName = null;
      pendingFieldBuffer = [];
      return;
    }
    switch (pendingFieldName) {
      case 'cite':
        pendingTask.citations = parseCitations(value);
        break;
      case 'what':
        pendingTask.what = value;
        break;
      case 'verify':
        pendingTask.verify = value;
        break;
      case 'notes':
        pendingTask.notes = value;
        pendingTask.dqTags = extractDqTags(value);
        break;
    }
    pendingFieldName = null;
    pendingFieldBuffer = [];
  }

  function flushTask(): void {
    flushField();
    if (!pendingTask) return;
    if (!pendingTask.verify) {
      warnings.push(`${pendingTask.id} has no Verify line.`);
    }
    tasks.push(pendingTask);
    const slice = slices[slices.length - 1];
    if (slice && slice.index === pendingTask.slice) {
      slice.taskIds.push(pendingTask.id);
    }
    pendingTask = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');

    // Open DQs block — bounded by the heading and the next blank line / heading.
    if (/Open DQs at time of authoring/i.test(line)) {
      inOpenDqsBlock = true;
      continue;
    }
    if (inOpenDqsBlock) {
      const match = OPEN_DQ_LINE.exec(line);
      if (match) {
        openDqs.push({ id: match[1], description: match[2] });
        continue;
      }
      // Exit the block on a non-list-item, non-blank line.
      if (line.trim() && !line.startsWith('-')) {
        inOpenDqsBlock = false;
      }
      // Continue past blank lines so we keep collecting list items.
    }

    // Slice heading
    const sliceMatch = SLICE_HEADING.exec(line);
    if (sliceMatch) {
      flushTask();
      currentSliceIndex = parseInt(sliceMatch[1]!, 10);
      currentSliceName = sliceMatch[2]!;
      slices.push({
        index: currentSliceIndex,
        name: currentSliceName,
        taskIds: [],
      });
      continue;
    }

    // Task heading
    const taskMatch = TASK_HEADING.exec(line);
    if (taskMatch) {
      flushTask();
      const statusChar = taskMatch[1]!;
      const id = taskMatch[2]!;
      const description = taskMatch[3]!;
      const status = STATUS_MAP[statusChar];
      if (!status) {
        warnings.push(`${id} has unrecognized status marker '${statusChar}'.`);
      }
      if (currentSliceIndex < 0) {
        warnings.push(`${id} appears before any slice heading.`);
      }
      pendingTask = {
        id,
        index: taskCounter++,
        status: status ?? 'pending',
        description,
        slice: currentSliceIndex,
        sliceName: currentSliceName,
        citations: { spec: [], design: [] },
        what: null,
        verify: null,
        notes: null,
        dqTags: [],
      };
      continue;
    }

    if (!pendingTask) continue;

    // Field bullet within the current task block
    const fieldMatch = FIELD_LINE.exec(line);
    if (fieldMatch) {
      flushField();
      const name = fieldMatch[1]!.toLowerCase() as
        | 'cite'
        | 'what'
        | 'verify'
        | 'notes';
      pendingFieldName = name;
      pendingFieldBuffer = [fieldMatch[2] ?? ''];
      continue;
    }

    // Continuation of the current field (indented or wrapped lines)
    if (pendingFieldName) {
      pendingFieldBuffer.push(line);
    }
  }

  // EOF flush
  flushTask();

  return { tasks, slices, openDqs, warnings };
}

/**
 * Splits a citation line on `;` to separate the spec side from the design side.
 * Convention from the methodology: `Cite: spec ...; design ...` (order may vary).
 */
function parseCitations(line: string): {
  spec: Citation[];
  design: Citation[];
} {
  const segments = line.split(';').map((s) => s.trim());
  const spec: Citation[] = [];
  const design: Citation[] = [];

  for (const segment of segments) {
    const lower = segment.toLowerCase();
    const isSpecSegment = lower.startsWith('spec');
    const isDesignSegment = lower.startsWith('design');
    const target = isDesignSegment ? design : spec;

    // If the segment doesn't explicitly say spec/design, fall back to context:
    // sections starting with §D go to design, otherwise spec.
    const explicit = isSpecSegment || isDesignSegment;

    // Token citations (BR-N, AC-N, etc.)
    for (const m of segment.matchAll(TOKEN_CITATION)) {
      const kind = m[1] as CitationKind;
      target.push({ kind, ref: `${m[1]}-${m[2]}` });
    }

    // Section citations (§N or §DN)
    for (const m of segment.matchAll(SECTION_CITATION)) {
      const isDesign = m[1] === 'D';
      const ref = `§${m[1]}${m[2]}`;
      const dest = explicit ? target : isDesign ? design : spec;
      dest.push({
        kind: isDesign ? 'design_section' : 'spec_section',
        ref,
      });
    }
  }

  return {
    spec: dedupeCitations(spec),
    design: dedupeCitations(design),
  };
}

function dedupeCitations(items: Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of items) {
    const key = `${c.kind}:${c.ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function extractDqTags(text: string): string[] {
  const tags = new Set<string>();
  // Match `[DQ-4]` bracketed form (canonical) and bare `DQ-4` for tolerance.
  const bracketed = /\[(DQ-\d+)\]/g;
  for (const m of text.matchAll(bracketed)) tags.add(m[1]!);
  // Also catch bare DQ refs in notes that the methodology would accept.
  const bare = /\b(DQ-\d+)\b/g;
  for (const m of text.matchAll(bare)) tags.add(m[1]!);
  return Array.from(tags).sort();
}

/**
 * Returns the next task that is `pending` AND whose prior tasks in the same
 * slice are all `done`. Cross-slice ordering is NOT enforced here — the
 * controller's slice gate handles that.
 */
export function nextActionableTask(parsed: ParsedTaskList): Task | null {
  for (let i = 0; i < parsed.tasks.length; i++) {
    const task = parsed.tasks[i]!;
    if (task.status !== 'pending') continue;

    const priorInSlice = parsed.tasks
      .slice(0, i)
      .filter((t) => t.slice === task.slice);

    const blocked = priorInSlice.some((t) => t.status !== 'done');
    if (blocked) continue;

    return task;
  }
  return null;
}

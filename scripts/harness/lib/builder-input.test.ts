import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBuilderInput, formatBuilderInputMarkdown } from './builder-input';
import { parseTaskList, type Task } from './task-parser';

const root = resolve(__dirname, '../../../docs/specs/incident-capture');
const tasksMd = readFileSync(`${root}/03-tasks.md`, 'utf8');
const specMd = readFileSync(`${root}/01-spec.md`, 'utf8');
const designMd = readFileSync(`${root}/02-design.md`, 'utf8');
const parsed = parseTaskList(tasksMd);

function task(id: string): Task {
  const t = parsed.tasks.find((x) => x.id === id);
  if (!t) throw new Error(`task ${id} not found`);
  return t;
}

describe('buildBuilderInput — T-01 (foundation, smallest surface)', () => {
  const input = buildBuilderInput({
    task: task('T-01'),
    specMarkdown: specMd,
    designMarkdown: designMd,
  });

  it('carries the task id and description', () => {
    expect(input.task_id).toBe('T-01');
    expect(input.description).toMatch(/TypeScript types/);
  });

  it('extracts spec §5 and design §D3 (T-01s only citations)', () => {
    const refs = input.citations.map((c) => c.ref);
    expect(refs).toEqual(['§5', '§D3']);
  });

  it('cited bodies contain the expected markers from the source', () => {
    const spec5 = input.citations.find((c) => c.ref === '§5')!;
    expect(spec5.source).toBe('spec');
    expect(spec5.body).toMatch(/^## §5 Data Model/);

    const designD3 = input.citations.find((c) => c.ref === '§D3')!;
    expect(designD3.source).toBe('design');
    expect(designD3.body).toMatch(/^## §D3 Data Model/);
    expect(designD3.body).toMatch(/interface Incident/);
  });

  it('passes through the Verify line and the TDD-waiver Notes', () => {
    expect(input.verify).toMatch(/tsc -b/);
    // T-01 carries a TDD-first waiver Note added by the drift-arbiter
    // (round 19) and applied as a follow-up amendment (round 20).
    // Previously this test asserted notes was null.
    expect(input.notes).toMatch(/TDD-first is waived/);
    expect(input.dq_tags).toEqual([]);
  });

  it('reports zero missing citations for T-01', () => {
    expect(input.missing_citations).toEqual([]);
  });

  it('defaults context_files to CLAUDE.md', () => {
    expect(input.context_files).toEqual(['CLAUDE.md']);
  });

  it('uses DEFAULT_BUDGET when none supplied', () => {
    expect(input.budget.tokens).toBeGreaterThan(0);
    expect(input.budget.wallClockMinutes).toBeGreaterThan(0);
    expect(input.budget.retries).toBeGreaterThanOrEqual(1);
  });
});

describe('buildBuilderInput — T-17 (mid-event editing, multiple BR cites)', () => {
  const input = buildBuilderInput({
    task: task('T-17'),
    specMarkdown: specMd,
    designMarkdown: designMd,
  });

  it('extracts every BR citation as a separate entry', () => {
    const brRefs = input.citations
      .filter((c) => c.ref.startsWith('BR-'))
      .map((c) => c.ref);
    expect(brRefs).toEqual(
      expect.arrayContaining(['BR-6', 'BR-7', 'BR-8', 'BR-9', 'BR-19', 'BR-22'])
    );
  });

  it('extracts the design §D3 section', () => {
    const d3 = input.citations.find((c) => c.ref === '§D3');
    expect(d3).toBeTruthy();
    expect(d3!.source).toBe('design');
  });

  it('zero missing citations', () => {
    expect(input.missing_citations).toEqual([]);
  });
});

describe('buildBuilderInput — DQ-tagged tasks carry forward the tag', () => {
  it('T-19 (chip catalog) surfaces DQ-5', () => {
    const input = buildBuilderInput({
      task: task('T-19'),
      specMarkdown: specMd,
      designMarkdown: designMd,
    });
    expect(input.dq_tags).toContain('DQ-5');
  });

  it('T-22 (journal) surfaces DQ-4', () => {
    const input = buildBuilderInput({
      task: task('T-22'),
      specMarkdown: specMd,
      designMarkdown: designMd,
    });
    expect(input.dq_tags).toContain('DQ-4');
  });
});

describe('buildBuilderInput — missing-citation surfacing', () => {
  it('reports citations not found in either artifact', () => {
    // Synthetic: build a task with a citation that doesn't exist anywhere.
    const fakeTask: Task = {
      ...task('T-01'),
      citations: {
        spec: [
          { kind: 'BR', ref: 'BR-999' },
          { kind: 'spec_section', ref: '§5' }, // exists
        ],
        design: [{ kind: 'design_section', ref: '§D99' }],
      },
    };
    const input = buildBuilderInput({
      task: fakeTask,
      specMarkdown: specMd,
      designMarkdown: designMd,
    });
    expect(input.missing_citations).toEqual(
      expect.arrayContaining(['BR-999', '§D99'])
    );
    // §5 still resolves successfully.
    expect(input.citations.map((c) => c.ref)).toContain('§5');
  });
});

describe('formatBuilderInputMarkdown', () => {
  const input = buildBuilderInput({
    task: task('T-01'),
    specMarkdown: specMd,
    designMarkdown: designMd,
  });
  const md = formatBuilderInputMarkdown(input);

  it('includes the task heading', () => {
    expect(md).toMatch(/^# Task: T-01 — TypeScript types/);
  });

  it('includes the slice context', () => {
    expect(md).toMatch(/Slice:\*\* 0 \(Foundation\)/);
  });

  it('embeds each cited body inside its own heading', () => {
    expect(md).toMatch(/### §5 \(spec\)/);
    expect(md).toMatch(/### §D3 \(design\)/);
  });

  it('includes the Verify line as its own section', () => {
    expect(md).toMatch(/## Verify \(the per-task gate\)/);
  });

  it('lists context files', () => {
    expect(md).toMatch(/## Project context files[\s\S]*CLAUDE\.md/);
  });

  it('shows the budget block', () => {
    expect(md).toMatch(/## Budget/);
    expect(md).toMatch(/tokens: ~/);
    expect(md).toMatch(/wall clock:/);
  });

  it('does NOT include a missing-citations warning when none exist', () => {
    expect(md).not.toMatch(/citations were not found/);
  });

  it('shows a clear warning when missing citations are present', () => {
    const fake = buildBuilderInput({
      task: {
        ...task('T-01'),
        citations: {
          spec: [{ kind: 'BR', ref: 'BR-999' }],
          design: [],
        },
      },
      specMarkdown: specMd,
      designMarkdown: designMd,
    });
    const fakeMd = formatBuilderInputMarkdown(fake);
    expect(fakeMd).toMatch(/citations were not found/);
    expect(fakeMd).toMatch(/BR-999/);
  });
});

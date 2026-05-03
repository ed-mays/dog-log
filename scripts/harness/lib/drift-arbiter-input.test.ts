import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildDriftArbiterInput,
  formatDriftArbiterInputMarkdown,
  normalizeCitedSections,
  type SpecGapPayload,
} from './drift-arbiter-input';

const root = resolve(__dirname, '../../../docs/specs/incident-capture');
const tasksMd = readFileSync(`${root}/03-tasks.md`, 'utf8');
const specMd = readFileSync(`${root}/01-spec.md`, 'utf8');
const designMd = readFileSync(`${root}/02-design.md`, 'utf8');

/**
 * The actual round-18 spec_gap payload from the V2 builder hand-test.
 * Used as the fixture for "the arbiter input must handle real builder output."
 */
const ROUND_18_SPEC_GAP: SpecGapPayload = {
  task_id: 'T-01',
  cited_section: '§D3 (design) — Data Model — Concrete; Verify line for T-01',
  gap_description:
    'The builder system prompt rule #2 (TDD discipline) requires writing tests first that assert the cited ACs. Task T-01 cites no ACs (it cites §D3, a concrete type definitions block) and its Verify line is structural: "pnpm exec tsc -b passes with the new file imported nowhere." Writing a test for the types would necessarily import the new file, which would violate the verify gate. The TDD rule and the Verify line therefore conflict on this task.',
  suggested_amendment:
    'Amend T-01 in one of two ways. (a) Preferred: change the Verify line to "pnpm exec tsc -b passes" and explicitly waive TDD for pure type-declaration tasks. (b) Alternative: keep the structural verify gate but add an explicit one-time pushback in the task notes authorizing the builder to skip rule #2.',
  files_inspected: [
    '/Users/edmays/src/dog-log/CLAUDE.md',
    '/Users/edmays/src/dog-log/src/features/medications/types.ts',
  ],
};

describe('normalizeCitedSections', () => {
  it('extracts a single typed ref from a string', () => {
    expect(normalizeCitedSections('BR-7')).toEqual(['BR-7']);
  });

  it('extracts a single section ref', () => {
    expect(normalizeCitedSections('§D3')).toEqual(['§D3']);
  });

  it('handles compound strings mixing refs with prose (the round-18 case)', () => {
    const out = normalizeCitedSections(
      '§D3 (design) — Data Model — Concrete; Verify line for T-01'
    );
    expect(out).toEqual(['§D3']);
  });

  it('handles a string with multiple typed refs', () => {
    expect(normalizeCitedSections('BR-7 + AC-1 conflict')).toEqual([
      'BR-7',
      'AC-1',
    ]);
  });

  it('handles array input', () => {
    expect(normalizeCitedSections(['BR-7', '§D3'])).toEqual(['BR-7', '§D3']);
  });

  it('dedupes refs found across multiple items', () => {
    expect(normalizeCitedSections(['BR-7', 'BR-7 again', '§5'])).toEqual([
      'BR-7',
      '§5',
    ]);
  });

  it('returns empty when nothing matches the citation grammar', () => {
    expect(normalizeCitedSections('no refs here')).toEqual([]);
  });
});

describe('buildDriftArbiterInput — against round-18 spec_gap', () => {
  const input = buildDriftArbiterInput({
    spec_gap: ROUND_18_SPEC_GAP,
    specMarkdown: specMd,
    designMarkdown: designMd,
    tasksMarkdown: tasksMd,
  });

  it('preserves the original spec_gap payload verbatim', () => {
    expect(input.spec_gap).toBe(ROUND_18_SPEC_GAP);
  });

  it('finds the T-01 task entry from the task list', () => {
    expect(input.task?.id).toBe('T-01');
    expect(input.task?.description).toMatch(/TypeScript types/);
    expect(input.task?.verify).toMatch(/tsc -b/);
  });

  it('extracts §D3 as a design excerpt', () => {
    const refs = input.cited_artifact_excerpts.map((c) => c.ref);
    expect(refs).toEqual(['§D3']);
    const d3 = input.cited_artifact_excerpts[0]!;
    expect(d3.source).toBe('design');
    expect(d3.body).toMatch(/^## §D3/);
  });

  it('reports zero missing citations for the round-18 case', () => {
    expect(input.missing_citations).toEqual([]);
  });

  it('captures recent spec §10 changelog entries', () => {
    expect(input.recent_spec_changelog).toMatch(/2026-05-01/);
  });

  it('captures recent design §D11 changelog entries', () => {
    expect(input.recent_design_changelog.length).toBeGreaterThan(0);
  });

  it('captures recent task §T0 changelog entries', () => {
    // Asserts non-empty extraction from §T0; specific entry text rotates as
    // the changelog grows past RECENT_CHANGELOG_ENTRIES (5).
    expect(input.recent_task_changelog.length).toBeGreaterThan(0);
    expect(input.recent_task_changelog).toMatch(/2026-05-0\d/);
  });

  it('defaults prior_arbitrations_for_this_task to 0', () => {
    expect(input.prior_arbitrations_for_this_task).toBe(0);
  });

  it('honors a non-zero priorArbitrations override', () => {
    const i2 = buildDriftArbiterInput({
      spec_gap: ROUND_18_SPEC_GAP,
      specMarkdown: specMd,
      designMarkdown: designMd,
      tasksMarkdown: tasksMd,
      priorArbitrations: 1,
    });
    expect(i2.prior_arbitrations_for_this_task).toBe(1);
  });
});

describe('buildDriftArbiterInput — missing citation surfacing', () => {
  it('reports refs not found in either artifact', () => {
    const fake: SpecGapPayload = {
      task_id: 'T-01',
      cited_section: ['BR-999', '§5', '§D99'],
      gap_description: 'fake gap',
    };
    const input = buildDriftArbiterInput({
      spec_gap: fake,
      specMarkdown: specMd,
      designMarkdown: designMd,
      tasksMarkdown: tasksMd,
    });
    expect(input.missing_citations).toEqual(
      expect.arrayContaining(['BR-999', '§D99'])
    );
    // §5 still resolves
    expect(input.cited_artifact_excerpts.map((c) => c.ref)).toContain('§5');
  });

  it('returns null task when task_id does not exist in task list', () => {
    const fake: SpecGapPayload = {
      task_id: 'T-999',
      cited_section: '§5',
      gap_description: 'fake gap',
    };
    const input = buildDriftArbiterInput({
      spec_gap: fake,
      specMarkdown: specMd,
      designMarkdown: designMd,
      tasksMarkdown: tasksMd,
    });
    expect(input.task).toBeNull();
  });
});

describe('formatDriftArbiterInputMarkdown', () => {
  const input = buildDriftArbiterInput({
    spec_gap: ROUND_18_SPEC_GAP,
    specMarkdown: specMd,
    designMarkdown: designMd,
    tasksMarkdown: tasksMd,
  });
  const md = formatDriftArbiterInputMarkdown(input);

  it('starts with the arbitration request heading', () => {
    expect(md).toMatch(/^# Arbitration request — T-01/);
  });

  it('embeds the gap description', () => {
    expect(md).toMatch(/## Builder spec_gap payload/);
    expect(md).toMatch(/TDD discipline/);
  });

  it("embeds the builder's suggested amendment when present", () => {
    expect(md).toMatch(/Builder-suggested amendment/);
    expect(md).toMatch(/Preferred/);
  });

  it('includes the parsed task entry with its verify line', () => {
    expect(md).toMatch(/## Task entry/);
    expect(md).toMatch(/T-01.*TypeScript types/);
    expect(md).toMatch(/Verify:.*tsc -b/);
  });

  it('embeds each cited artifact excerpt under its ref heading', () => {
    expect(md).toMatch(/## Cited artifact excerpts[\s\S]*### §D3 \(design\)/);
  });

  it('shows the three changelog blocks (spec, design, task)', () => {
    expect(md).toMatch(/### Spec §10/);
    expect(md).toMatch(/### Design §D11/);
    expect(md).toMatch(/### Task list \(T0\)/);
  });

  it('omits the prior-arbitrations warning when count is 0', () => {
    expect(md).not.toMatch(/Prior arbitrations on this task/);
  });

  it('shows the prior-arbitrations warning when count > 0', () => {
    const i2 = buildDriftArbiterInput({
      spec_gap: ROUND_18_SPEC_GAP,
      specMarkdown: specMd,
      designMarkdown: designMd,
      tasksMarkdown: tasksMd,
      priorArbitrations: 1,
    });
    const md2 = formatDriftArbiterInputMarkdown(i2);
    expect(md2).toMatch(/Prior arbitrations on this task: 1/);
  });

  it('omits the missing-citations warning when none exist', () => {
    expect(md).not.toMatch(/could not be resolved/);
  });

  it('shows the missing-citations warning when refs are missing', () => {
    const fake = buildDriftArbiterInput({
      spec_gap: {
        task_id: 'T-01',
        cited_section: 'BR-999',
        gap_description: 'fake',
      },
      specMarkdown: specMd,
      designMarkdown: designMd,
      tasksMarkdown: tasksMd,
    });
    const fakeMd = formatDriftArbiterInputMarkdown(fake);
    expect(fakeMd).toMatch(/could not be resolved/);
    expect(fakeMd).toMatch(/BR-999/);
  });

  it('shows a clear marker when the task is not found', () => {
    const fake = buildDriftArbiterInput({
      spec_gap: {
        task_id: 'T-999',
        cited_section: '§5',
        gap_description: 'fake',
      },
      specMarkdown: specMd,
      designMarkdown: designMd,
      tasksMarkdown: tasksMd,
    });
    const fakeMd = formatDriftArbiterInputMarkdown(fake);
    expect(fakeMd).toMatch(/T-999 not found/);
    expect(fakeMd).toMatch(/propose a pushback/);
  });
});

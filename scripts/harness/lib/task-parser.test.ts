import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nextActionableTask, parseTaskList, type Task } from './task-parser';

const realTasksPath = resolve(
  __dirname,
  '../../../docs/specs/incident-capture/03-tasks.md'
);
const realMarkdown = readFileSync(realTasksPath, 'utf8');
const real = parseTaskList(realMarkdown);

function task(parsed: ReturnType<typeof parseTaskList>, id: string): Task {
  const found = parsed.tasks.find((t) => t.id === id);
  if (!found) throw new Error(`task ${id} not in parse result`);
  return found;
}

describe('parseTaskList — against real 03-tasks.md', () => {
  it('parses all 47 tasks', () => {
    expect(real.tasks.length).toBe(47);
  });

  it('identifies all 6 slices including foundation (slice 0)', () => {
    expect(real.slices.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(real.slices[0]?.name).toBe('Foundation');
  });

  it('emits zero warnings on the canonical file', () => {
    expect(real.warnings).toEqual([]);
  });

  it('every feature-slice task (slices 0–4) has at least one spec or design citation', () => {
    // Slice 5 is verify & close — some tasks there cite process docs
    // (CLAUDE.md, "plan Phase 6") rather than spec/design sections, which is
    // legitimate. The harness's citation-linter will need a similar carve-out.
    for (const t of real.tasks) {
      if (t.slice === 5) continue;
      const total = t.citations.spec.length + t.citations.design.length;
      expect(total, `${t.id} has no citations`).toBeGreaterThan(0);
    }
  });

  it('every task has a non-null Verify line (methodology requirement)', () => {
    for (const t of real.tasks) {
      expect(t.verify, `${t.id} missing Verify`).not.toBeNull();
    }
  });

  it('captures the open DQs from the preamble', () => {
    const ids = real.openDqs.map((d) => d.id);
    expect(ids).toEqual(['DQ-4', 'DQ-5', 'DQ-8']);
  });

  it('every parsed task has a known status', () => {
    const validStatuses = new Set([
      'pending',
      'in_progress',
      'done',
      'blocked',
    ]);
    for (const t of real.tasks) {
      expect(validStatuses.has(t.status)).toBe(true);
    }
  });

  it('parses T-01 cite line into spec §5 + design §D3', () => {
    const t01 = task(real, 'T-01');
    expect(t01.citations.spec).toEqual([{ kind: 'spec_section', ref: '§5' }]);
    expect(t01.citations.design).toEqual([
      { kind: 'design_section', ref: '§D3' },
    ]);
  });

  it('parses a multi-citation cite line (T-17)', () => {
    const t17 = task(real, 'T-17');
    // T-17 cites: spec BR-6, BR-7, BR-8, BR-9, BR-19, BR-22; design §D3
    const specRefs = t17.citations.spec.map((c) => c.ref);
    expect(specRefs).toEqual(
      expect.arrayContaining(['BR-6', 'BR-7', 'BR-8', 'BR-9', 'BR-19', 'BR-22'])
    );
    expect(t17.citations.design).toContainEqual({
      kind: 'design_section',
      ref: '§D3',
    });
  });

  it('extracts DQ tags from notes (T-19 references DQ-5)', () => {
    const t19 = task(real, 'T-19');
    expect(t19.dqTags).toContain('DQ-5');
  });

  it('preserves slice membership (T-06 is in slice 1, T-37 in slice 4)', () => {
    expect(task(real, 'T-06').slice).toBe(1);
    expect(task(real, 'T-37').slice).toBe(4);
  });

  it('slice taskIds are populated and non-overlapping', () => {
    const seen = new Set<string>();
    for (const slice of real.slices) {
      for (const id of slice.taskIds) {
        expect(seen.has(id), `${id} in two slices`).toBe(false);
        seen.add(id);
      }
    }
    expect(seen.size).toBe(47);
  });
});

describe('parseTaskList — targeted fixtures', () => {
  it('handles each status marker', () => {
    const md = `## Slice 0 — Test
### \`[ ]\` T-01 — pending one
- **Verify:** ok
### \`[~]\` T-02 — in progress one
- **Verify:** ok
### \`[x]\` T-03 — done one
- **Verify:** ok
### \`[!]\` T-04 — blocked one
- **Verify:** ok
`;
    const p = parseTaskList(md);
    expect(p.tasks.map((t) => t.status)).toEqual([
      'pending',
      'in_progress',
      'done',
      'blocked',
    ]);
  });

  it('warns when a Verify line is missing', () => {
    const md = `## Slice 0 — Test
### \`[ ]\` T-01 — no verify
- **What:** something
`;
    const p = parseTaskList(md);
    expect(p.warnings).toContain('T-01 has no Verify line.');
  });

  it('warns on unknown status marker but still emits the task', () => {
    const md = `## Slice 0 — Test
### \`[?]\` T-01 — weird marker
- **Verify:** ok
`;
    const p = parseTaskList(md);
    expect(p.warnings.some((w) => w.includes('unrecognized status'))).toBe(
      true
    );
    expect(p.tasks).toHaveLength(1);
    expect(p.tasks[0]?.status).toBe('pending');
  });

  it('warns on tasks before any slice heading', () => {
    const md = `### \`[ ]\` T-01 — orphan
- **Verify:** ok
`;
    const p = parseTaskList(md);
    expect(p.warnings.some((w) => w.includes('appears before any slice'))).toBe(
      true
    );
  });

  it('separates spec and design citations even with reversed order', () => {
    const md = `## Slice 0 — Test
### \`[ ]\` T-01 — reverse
- **Cite:** design §D2; spec BR-7
- **Verify:** ok
`;
    const p = parseTaskList(md);
    expect(p.tasks[0]?.citations.spec).toEqual([{ kind: 'BR', ref: 'BR-7' }]);
    expect(p.tasks[0]?.citations.design).toEqual([
      { kind: 'design_section', ref: '§D2' },
    ]);
  });

  it('falls back on §N → spec, §DN → design when no spec/design label is present', () => {
    const md = `## Slice 0 — Test
### \`[ ]\` T-01 — bare sections
- **Cite:** §5, §D3
- **Verify:** ok
`;
    const p = parseTaskList(md);
    expect(p.tasks[0]?.citations.spec).toContainEqual({
      kind: 'spec_section',
      ref: '§5',
    });
    expect(p.tasks[0]?.citations.design).toContainEqual({
      kind: 'design_section',
      ref: '§D3',
    });
  });

  it('dedupes repeated citations in a single Cite line', () => {
    const md = `## Slice 0 — Test
### \`[ ]\` T-01 — duplicate cites
- **Cite:** spec BR-7, BR-7, BR-7; design §D3, §D3
- **Verify:** ok
`;
    const p = parseTaskList(md);
    expect(p.tasks[0]?.citations.spec).toEqual([{ kind: 'BR', ref: 'BR-7' }]);
    expect(p.tasks[0]?.citations.design).toEqual([
      { kind: 'design_section', ref: '§D3' },
    ]);
  });

  it('captures DQ tags whether bracketed or bare', () => {
    const md = `## Slice 0 — Test
### \`[ ]\` T-01 — DQ tags
- **Verify:** ok
- **Notes:** [DQ-4] one bracketed; also DQ-5 bare and DQ-4 again.
`;
    const p = parseTaskList(md);
    expect(p.tasks[0]?.dqTags).toEqual(['DQ-4', 'DQ-5']);
  });

  it('parses open DQs from the preamble block only', () => {
    const md = `# Tasks

**Open DQs at time of authoring**:

- **DQ-4** one
- **DQ-5** two

## Slice 0 — Test

### \`[ ]\` T-01 — t
- **Notes:** [DQ-4] inline reference, not an open DQ
- **Verify:** ok
`;
    const p = parseTaskList(md);
    expect(p.openDqs.map((d) => d.id)).toEqual(['DQ-4', 'DQ-5']);
  });
});

describe('nextActionableTask', () => {
  it('returns null when all tasks are done', () => {
    const md = `## Slice 0 — Test
### \`[x]\` T-01 — one
- **Verify:** ok
### \`[x]\` T-02 — two
- **Verify:** ok
`;
    expect(nextActionableTask(parseTaskList(md))).toBeNull();
  });

  it('returns the first pending task when no priors block it', () => {
    const md = `## Slice 0 — Test
### \`[x]\` T-01 — one
- **Verify:** ok
### \`[ ]\` T-02 — two
- **Verify:** ok
### \`[ ]\` T-03 — three
- **Verify:** ok
`;
    const next = nextActionableTask(parseTaskList(md));
    expect(next?.id).toBe('T-02');
  });

  it('skips a pending task whose same-slice prior is not done', () => {
    const md = `## Slice 0 — Test
### \`[ ]\` T-01 — one
- **Verify:** ok
### \`[ ]\` T-02 — two
- **Verify:** ok
`;
    // T-01 is pending with no priors → it should be next; T-02 is blocked by T-01.
    const next = nextActionableTask(parseTaskList(md));
    expect(next?.id).toBe('T-01');
  });

  it('does not consider cross-slice priors as blockers', () => {
    const md = `## Slice 0 — Foundation
### \`[ ]\` T-01 — slice 0 work
- **Verify:** ok
## Slice 1 — Next
### \`[ ]\` T-02 — slice 1 work
- **Verify:** ok
`;
    const parsed = parseTaskList(md);
    // T-01 is the next actionable; T-02's same-slice priors are empty,
    // so it would also be returned if T-01 were done. The function returns
    // the FIRST pending in document order with satisfied same-slice priors.
    const next = nextActionableTask(parsed);
    expect(next?.id).toBe('T-01');
  });

  it('on the real task list, returns the first pending task in document order', () => {
    const next = nextActionableTask(real);
    const firstPending = real.tasks.find((t) => t.status === 'pending');
    expect(next?.id).toBe(firstPending?.id);
  });
});

describe('real-file structural assertions', () => {
  it('foundation slice (slice 0) has 5 tasks: T-01..T-05', () => {
    const slice0 = real.slices.find((s) => s.index === 0);
    expect(slice0?.taskIds).toEqual(['T-01', 'T-02', 'T-03', 'T-04', 'T-05']);
  });

  it('slice 5 (verify & close) ends with T-47', () => {
    const slice5 = real.slices.find((s) => s.index === 5);
    expect(slice5?.taskIds.at(-1)).toBe('T-47');
  });

  it('slice-end smoke tasks exist (T-16, T-26, T-36, T-41)', () => {
    for (const id of ['T-16', 'T-26', 'T-36', 'T-41']) {
      const t = task(real, id);
      expect(t.description.toLowerCase()).toContain('smoke');
    }
  });

  it('T-22 (journal) carries the DQ-4 tag', () => {
    expect(task(real, 'T-22').dqTags).toContain('DQ-4');
  });

  it('T-19 (chip catalog) carries the DQ-5 tag', () => {
    expect(task(real, 'T-19').dqTags).toContain('DQ-5');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadNext, loadStatus } from './controller';

const realTasksPath = resolve(
  __dirname,
  '../../../docs/specs/incident-capture/03-tasks.md'
);
const realMarkdown = readFileSync(realTasksPath, 'utf8');

describe('loadStatus — against real 03-tasks.md', () => {
  it('counts 47 total pending tasks across 6 slices', () => {
    const s = loadStatus(realMarkdown);
    expect(s.total).toBe(47);
    expect(s.pending).toBe(47);
    expect(s.done).toBe(0);
    expect(s.slices).toHaveLength(6);
  });

  it('per-slice totals sum to overall total', () => {
    const s = loadStatus(realMarkdown);
    const sum = s.slices.reduce((acc, sl) => acc + sl.total, 0);
    expect(sum).toBe(s.total);
  });

  it('foundation slice (0) has 5 tasks all pending, none complete', () => {
    const s = loadStatus(realMarkdown);
    const slice0 = s.slices.find((sl) => sl.index === 0)!;
    expect(slice0.total).toBe(5);
    expect(slice0.pending).toBe(5);
    expect(slice0.complete).toBe(false);
  });

  it('passes through openDqs and warnings from the parser', () => {
    const s = loadStatus(realMarkdown);
    expect(s.openDqs.map((d) => d.id)).toEqual(['DQ-4', 'DQ-5', 'DQ-8']);
    expect(s.warnings).toEqual([]);
  });
});

describe('loadNext — against real 03-tasks.md', () => {
  it('returns T-01 as the next actionable task', () => {
    const next = loadNext(realMarkdown);
    expect(next.task?.id).toBe('T-01');
  });

  it('does NOT flag a slice-boundary halt for T-01 (slice 0 is foundation)', () => {
    const next = loadNext(realMarkdown);
    expect(next.atSliceBoundary).toBe(false);
  });

  it('reports the slice T-01 belongs to', () => {
    const next = loadNext(realMarkdown);
    expect(next.slice?.index).toBe(0);
    expect(next.slice?.name).toBe('Foundation');
  });
});

describe('loadNext — slice-boundary detection', () => {
  it('flags atSliceBoundary when the first task of slice 1 is reached with slice 0 fully done', () => {
    const md = `## Slice 0 — Foundation
### \`[x]\` T-01 — types
- **Verify:** ok
### \`[x]\` T-02 — flag
- **Verify:** ok
## Slice 1 — Real
### \`[ ]\` T-03 — first real task
- **Verify:** ok
### \`[ ]\` T-04 — second real task
- **Verify:** ok
`;
    const next = loadNext(md);
    expect(next.task?.id).toBe('T-03');
    expect(next.atSliceBoundary).toBe(true);
  });

  it('does NOT flag atSliceBoundary when slice 1 already has a done task', () => {
    const md = `## Slice 0 — Foundation
### \`[x]\` T-01 — types
- **Verify:** ok
## Slice 1 — Real
### \`[x]\` T-02 — first real task
- **Verify:** ok
### \`[ ]\` T-03 — second real task
- **Verify:** ok
`;
    const next = loadNext(md);
    expect(next.task?.id).toBe('T-03');
    expect(next.atSliceBoundary).toBe(false);
  });

  it('does NOT flag atSliceBoundary mid-slice (in-progress task in same slice)', () => {
    const md = `## Slice 0 — Foundation
### \`[~]\` T-01 — in progress
- **Verify:** ok
### \`[ ]\` T-02 — should be next once T-01 done
- **Verify:** ok
`;
    // T-01 is in_progress (not pending), so nextActionable returns T-02 (its
    // same-slice prior is not done). Confirm: nextActionable skips in_progress
    // priors as blockers. Per task-parser, "blocked" means "prior status !== done".
    const next = loadNext(md);
    // T-01 is not actionable because its status is in_progress, not pending.
    // T-02 is not actionable because T-01 (its prior) is not done.
    // So next is null.
    expect(next.task).toBeNull();
  });

  it('returns null task when all tasks are done', () => {
    const md = `## Slice 0 — Foundation
### \`[x]\` T-01 — done
- **Verify:** ok
`;
    const next = loadNext(md);
    expect(next.task).toBeNull();
    expect(next.atSliceBoundary).toBe(false);
    expect(next.slice).toBeNull();
  });
});

describe('loadStatus — slice completion', () => {
  it('marks a slice complete when all its tasks are done', () => {
    const md = `## Slice 0 — Foundation
### \`[x]\` T-01 — types
- **Verify:** ok
### \`[x]\` T-02 — flag
- **Verify:** ok
## Slice 1 — Next
### \`[ ]\` T-03 — work
- **Verify:** ok
`;
    const s = loadStatus(md);
    const slice0 = s.slices.find((sl) => sl.index === 0)!;
    const slice1 = s.slices.find((sl) => sl.index === 1)!;
    expect(slice0.complete).toBe(true);
    expect(slice1.complete).toBe(false);
  });

  it('counts each status bucket per slice', () => {
    const md = `## Slice 0 — Mixed
### \`[x]\` T-01 — done
- **Verify:** ok
### \`[~]\` T-02 — in progress
- **Verify:** ok
### \`[ ]\` T-03 — pending
- **Verify:** ok
### \`[!]\` T-04 — blocked
- **Verify:** ok
`;
    const s = loadStatus(md);
    const slice0 = s.slices.find((sl) => sl.index === 0)!;
    expect(slice0).toMatchObject({
      total: 4,
      done: 1,
      inProgress: 1,
      pending: 1,
      blocked: 1,
      complete: false,
    });
  });
});

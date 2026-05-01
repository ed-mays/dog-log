import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildColdReaderInput,
  extractChangedFiles,
  formatColdReaderInputMarkdown,
} from './cold-reader-input';
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

const SAMPLE_DIFF = `diff --git a/src/features/incidents/types.ts b/src/features/incidents/types.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/features/incidents/types.ts
@@ -0,0 +1,10 @@
+export type IncidentTypeId = 'seizure' | 'injury' | 'other';
+export interface Incident {
+  id: string;
+  petId: string;
+  startedAt: string;
+}
diff --git a/src/features/incidents/types.test.ts b/src/features/incidents/types.test.ts
new file mode 100644
index 0000000..89abcdef
--- /dev/null
+++ b/src/features/incidents/types.test.ts
@@ -0,0 +1,5 @@
+import { describe } from 'vitest';
+describe('types', () => {});
`;

describe('buildColdReaderInput — T-01 with a sample diff', () => {
  const input = buildColdReaderInput({
    task: task('T-01'),
    specMarkdown: specMd,
    designMarkdown: designMd,
    diff: SAMPLE_DIFF,
  });

  it('carries task id and description', () => {
    expect(input.task_id).toBe('T-01');
    expect(input.task_description).toMatch(/TypeScript types/);
  });

  it('extracts the cited spec/design sections (separated)', () => {
    expect(input.cited_spec_sections.map((c) => c.ref)).toEqual(['§5']);
    expect(input.cited_design_sections.map((c) => c.ref)).toEqual(['§D3']);
  });

  it('preserves the verbatim diff', () => {
    expect(input.diff).toBe(SAMPLE_DIFF);
  });

  it('detects the two changed files in the diff', () => {
    expect(input.changed_files).toEqual([
      'src/features/incidents/types.test.ts',
      'src/features/incidents/types.ts',
    ]);
  });

  it('reports zero missing citations for T-01', () => {
    expect(input.missing_citations).toEqual([]);
  });

  it('passes through the Verify line', () => {
    expect(input.verify_line).toMatch(/tsc -b/);
  });
});

describe('buildColdReaderInput — T-17 (multi-cite)', () => {
  const input = buildColdReaderInput({
    task: task('T-17'),
    specMarkdown: specMd,
    designMarkdown: designMd,
    diff: '',
  });

  it('extracts every BR cite as its own entry', () => {
    const refs = input.cited_spec_sections.map((c) => c.ref);
    expect(refs).toEqual(
      expect.arrayContaining(['BR-6', 'BR-7', 'BR-8', 'BR-9', 'BR-19', 'BR-22'])
    );
  });

  it('handles an empty diff (zero changed files)', () => {
    expect(input.changed_files).toEqual([]);
    expect(input.diff).toBe('');
  });
});

describe('buildColdReaderInput — missing citations surfaced', () => {
  it('reports refs not found in the source artifacts', () => {
    const fake: Task = {
      ...task('T-01'),
      citations: {
        spec: [
          { kind: 'BR', ref: 'BR-999' },
          { kind: 'spec_section', ref: '§5' },
        ],
        design: [{ kind: 'design_section', ref: '§D99' }],
      },
    };
    const input = buildColdReaderInput({
      task: fake,
      specMarkdown: specMd,
      designMarkdown: designMd,
      diff: '',
    });
    expect(input.missing_citations).toEqual(
      expect.arrayContaining(['BR-999', '§D99'])
    );
    // §5 still resolves
    expect(input.cited_spec_sections.map((c) => c.ref)).toContain('§5');
  });
});

describe('extractChangedFiles', () => {
  it('returns empty array for an empty diff', () => {
    expect(extractChangedFiles('')).toEqual([]);
  });

  it('extracts a single file from a minimal diff', () => {
    const d = `diff --git a/foo.ts b/foo.ts
@@ -1,1 +1,2 @@
 line
+new
`;
    expect(extractChangedFiles(d)).toEqual(['foo.ts']);
  });

  it('extracts multiple files and dedupes', () => {
    const d = `diff --git a/a.ts b/a.ts
diff --git a/b.ts b/b.ts
diff --git a/a.ts b/a.ts
`;
    expect(extractChangedFiles(d)).toEqual(['a.ts', 'b.ts']);
  });

  it('uses the b/ path for renames', () => {
    const d = `diff --git a/old.ts b/new.ts
similarity index 95%
rename from old.ts
rename to new.ts
`;
    expect(extractChangedFiles(d)).toEqual(['new.ts']);
  });
});

describe('formatColdReaderInputMarkdown', () => {
  const input = buildColdReaderInput({
    task: task('T-01'),
    specMarkdown: specMd,
    designMarkdown: designMd,
    diff: SAMPLE_DIFF,
  });
  const out = formatColdReaderInputMarkdown(input);

  it('starts with the task heading', () => {
    expect(out).toMatch(/^# Task under review: T-01/);
  });

  it('shows the verify line near the top', () => {
    expect(out).toMatch(/Verify line.*tsc -b/);
  });

  it('embeds each cited spec section under its ref heading', () => {
    expect(out).toMatch(/## Cited spec sections[\s\S]*### §5/);
  });

  it('embeds each cited design section under its ref heading', () => {
    expect(out).toMatch(/## Cited design sections[\s\S]*### §D3/);
  });

  it('lists the changed files', () => {
    expect(out).toMatch(/## Changed files[\s\S]*types\.test\.ts/);
  });

  it('inlines the diff inside a fenced ```diff block', () => {
    expect(out).toMatch(/## Diff\n\n```diff\n[\s\S]+\n```$/);
  });

  it('omits the missing-citations warning when none exist', () => {
    expect(out).not.toMatch(/citations on the task could not be resolved/);
  });

  it('includes the missing-citations warning when refs are missing', () => {
    const fake = buildColdReaderInput({
      task: {
        ...task('T-01'),
        citations: {
          spec: [{ kind: 'BR', ref: 'BR-999' }],
          design: [],
        },
      },
      specMarkdown: specMd,
      designMarkdown: designMd,
      diff: '',
    });
    const fakeOut = formatColdReaderInputMarkdown(fake);
    expect(fakeOut).toMatch(/citations on the task could not be resolved/);
    expect(fakeOut).toMatch(/BR-999/);
  });

  it('handles an empty diff with a clear marker', () => {
    const empty = buildColdReaderInput({
      task: task('T-01'),
      specMarkdown: specMd,
      designMarkdown: designMd,
      diff: '',
    });
    const out2 = formatColdReaderInputMarkdown(empty);
    expect(out2).toMatch(/_\(none — empty diff\)_/);
  });
});

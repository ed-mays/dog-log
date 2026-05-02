#!/usr/bin/env node
/**
 * Parser corpus eval runner.
 *
 * Re-parses each tracked artifact and diffs the produced summary against
 * a stored JSON snapshot. Catches silent behavioral drift in the parsers
 * that unit tests would miss.
 *
 * Run: pnpm tsx scripts/harness/evals/parsers/run.ts
 *      pnpm tsx scripts/harness/evals/parsers/run.ts --update    # regenerate snapshots
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractSpecSection } from '../../lib/spec-parser';
import { parseTaskList } from '../../lib/task-parser';

/**
 * Enumerate every section heading in a spec/design markdown file.
 * Matches `## §N` and `## §DN` (level-2 headings only). For each
 * discovered ref, verify the parser can round-trip it via
 * extractSpecSection — that's the contract under test.
 */
function discoverSpecSections(markdown: string): string[] {
  const refs = new Set<string>();
  for (const m of markdown.matchAll(/^##\s+§(D?\d+)/gm)) {
    refs.add(`§${m[1]}`);
  }
  return [...refs].sort((a, b) => {
    const an = parseInt(a.replace(/[§D]/g, ''), 10);
    const bn = parseInt(b.replace(/[§D]/g, ''), 10);
    return an - bn;
  });
}

function summarizeSpec(text: string): unknown {
  const refs = discoverSpecSections(text);
  const roundTripFailures: string[] = [];
  for (const ref of refs) {
    if (extractSpecSection(text, ref) === null) {
      roundTripFailures.push(ref);
    }
  }
  return {
    section_count: refs.length,
    section_ids: refs,
    round_trip_failures: roundTripFailures,
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');
const SNAPSHOT_DIR = resolve(__dirname, 'snapshots');

interface ParserSnapshot {
  id: string;
  source_path: string;
  snapshot_path: string;
  /** Produces a summary object suitable for stable JSON serialization. */
  build: (sourceText: string) => unknown;
}

const SNAPSHOTS: ParserSnapshot[] = [
  {
    id: 'task-parser-03-tasks',
    source_path: 'docs/specs/incident-capture/03-tasks.md',
    snapshot_path: resolve(SNAPSHOT_DIR, 'task-parser-03-tasks.snapshot.json'),
    build: (text: string) => {
      const parsed = parseTaskList(text);
      return {
        slice_count: parsed.slices.length,
        slices: parsed.slices.map((s) => ({
          index: s.index,
          name: s.name,
          task_count: s.taskIds.length,
          task_ids: s.taskIds,
        })),
        task_count: parsed.tasks.length,
        tasks: parsed.tasks.map((t) => ({
          id: t.id,
          status: t.status,
          slice: t.slice,
          spec_citations: t.citations.spec
            .map((c) => `${c.kind}:${c.ref}`)
            .sort(),
          design_citations: t.citations.design
            .map((c) => `${c.kind}:${c.ref}`)
            .sort(),
          dq_tags: [...t.dqTags].sort(),
          has_notes: Boolean(t.notes),
        })),
        open_dqs: parsed.openDqs.map((d) => d.id).sort(),
      };
    },
  },
  {
    id: 'spec-parser-01-spec-sections',
    source_path: 'docs/specs/incident-capture/01-spec.md',
    snapshot_path: resolve(
      SNAPSHOT_DIR,
      'spec-parser-01-spec-sections.snapshot.json'
    ),
    build: summarizeSpec,
  },
  {
    id: 'spec-parser-02-design-sections',
    source_path: 'docs/specs/incident-capture/02-design.md',
    snapshot_path: resolve(
      SNAPSHOT_DIR,
      'spec-parser-02-design-sections.snapshot.json'
    ),
    build: summarizeSpec,
  },
];

interface ParserResult {
  id: string;
  ok: boolean;
  diff?: string;
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function unifiedDiff(expected: string, actual: string, file: string): string {
  const e = expected.split('\n');
  const a = actual.split('\n');
  const lines: string[] = [`--- ${file}`, `+++ <actual>`];
  const max = Math.max(e.length, a.length);
  for (let i = 0; i < max; i++) {
    const ev = e[i] ?? '<EOF>';
    const av = a[i] ?? '<EOF>';
    if (ev !== av) {
      lines.push(`@@ line ${i + 1} @@`);
      lines.push(`- ${ev}`);
      lines.push(`+ ${av}`);
    }
  }
  return lines.join('\n');
}

export function checkParserSnapshot(
  s: ParserSnapshot,
  options: { update?: boolean } = {}
): ParserResult {
  const sourceText = readFileSync(resolve(REPO_ROOT, s.source_path), 'utf8');
  const summary = s.build(sourceText);
  const actual = stableJson(summary);

  if (options.update) {
    writeFileSync(s.snapshot_path, actual);
    return { id: s.id, ok: true };
  }

  let expected: string;
  try {
    expected = readFileSync(s.snapshot_path, 'utf8');
  } catch {
    return {
      id: s.id,
      ok: false,
      diff: `snapshot file missing: ${s.snapshot_path}`,
    };
  }
  if (actual === expected) return { id: s.id, ok: true };
  return {
    id: s.id,
    ok: false,
    diff: unifiedDiff(expected, actual, s.snapshot_path),
  };
}

function main(): void {
  const update = process.argv.includes('--update');
  const lines: string[] = [];
  lines.push(
    update
      ? 'Parser corpus eval — REGENERATING snapshots'
      : 'Parser corpus eval — re-parse + diff'
  );
  lines.push('');

  let failures = 0;
  for (const s of SNAPSHOTS) {
    const result = checkParserSnapshot(s, { update });
    if (result.ok) {
      lines.push(`  [${update ? 'WROTE' : 'PASS'}] ${s.id}`);
    } else {
      failures += 1;
      lines.push(`  [FAIL] ${s.id}`);
      if (result.diff) {
        for (const line of result.diff.split('\n').slice(0, 30)) {
          lines.push(`    ${line}`);
        }
        if (result.diff.split('\n').length > 30) {
          lines.push(`    ... (truncated)`);
        }
      }
    }
  }

  lines.push('');
  lines.push(`  Total: ${SNAPSHOTS.length}; failures: ${failures}`);
  if (failures > 0) {
    lines.push('');
    lines.push(
      '  Run with --update to regenerate snapshots after intentional changes.'
    );
  }

  process.stdout.write(`${lines.join('\n')}\n`);
  if (failures > 0) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

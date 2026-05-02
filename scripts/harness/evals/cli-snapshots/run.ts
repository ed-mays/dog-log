#!/usr/bin/env node
/**
 * CLI snapshot eval runner.
 *
 * Re-invokes each CLI command (`prepare`, `cold-read`, `arbitrate`) against
 * a pinned input, captures stdout, and diffs against a stored snapshot.
 * Exits 1 with a unified diff on any mismatch.
 *
 * Run: pnpm tsx scripts/harness/evals/cli-snapshots/run.ts
 *
 * To regenerate snapshots after an intentional template change, see this
 * suite's README.md.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');
const SNAPSHOT_DIR = resolve(__dirname, 'snapshots');

interface Snapshot {
  id: string;
  /** Args after `tsx scripts/harness/cli.ts`. */
  cli_args: string[];
  /** Optional setup that produces an extra arg (e.g. a temp file path). */
  prepare?: () => string[];
  snapshot_file: string;
}

const ARBITER_CASE_PATH = resolve(
  REPO_ROOT,
  'scripts/harness/evals/drift-arbiter/cases/regression/T-01-V2-spec-gap.json'
);

const SNAPSHOTS: Snapshot[] = [
  {
    id: 'prepare-T-02',
    cli_args: ['prepare', 'T-02'],
    snapshot_file: resolve(SNAPSHOT_DIR, 'prepare-T-02.snapshot.md'),
  },
  {
    id: 'cold-read-T-01-no-diff',
    // Use HEAD..HEAD to force an empty diff regardless of working-tree state.
    // (The CLI defaults to `git diff HEAD` which is sensitive to uncommitted
    // changes — fine for real cold-reads, broken for snapshot stability.)
    cli_args: ['cold-read', 'T-01', '--diff', 'HEAD..HEAD'],
    snapshot_file: resolve(SNAPSHOT_DIR, 'cold-read-T-01-no-diff.snapshot.md'),
  },
  {
    id: 'arbitrate-T-01-V2-spec-gap',
    cli_args: ['arbitrate'],
    prepare: () => {
      const tmpDir = mkdtempSync(`${tmpdir()}/harness-cli-snap-`);
      const inputPath = resolve(tmpDir, 'spec-gap.json');
      const caseRaw = readFileSync(ARBITER_CASE_PATH, 'utf8');
      const parsed = JSON.parse(caseRaw) as {
        input: { spec_gap: unknown };
      };
      writeFileSync(inputPath, JSON.stringify(parsed.input.spec_gap, null, 2));
      return [inputPath];
    },
    snapshot_file: resolve(
      SNAPSHOT_DIR,
      'arbitrate-T-01-V2-spec-gap.snapshot.md'
    ),
  },
];

function runCli(args: string[]): string {
  return execFileSync('pnpm', ['tsx', 'scripts/harness/cli.ts', ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
}

interface SnapshotResult {
  id: string;
  ok: boolean;
  diff?: string;
}

/** Tiny line-level diff. Good enough for snapshot output; no deps. */
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

export function checkSnapshot(s: Snapshot): SnapshotResult {
  const extraArgs = s.prepare ? s.prepare() : [];
  const args = [...s.cli_args, ...extraArgs];
  const actual = runCli(args);
  let expected: string;
  try {
    expected = readFileSync(s.snapshot_file, 'utf8');
  } catch {
    return {
      id: s.id,
      ok: false,
      diff: `snapshot file missing: ${s.snapshot_file}`,
    };
  }
  if (actual === expected) return { id: s.id, ok: true };
  return {
    id: s.id,
    ok: false,
    diff: unifiedDiff(expected, actual, s.snapshot_file),
  };
}

function main(): void {
  const lines: string[] = [];
  lines.push('CLI snapshot eval — re-invoke each command and diff');
  lines.push('');

  let failures = 0;
  for (const s of SNAPSHOTS) {
    const result = checkSnapshot(s);
    if (result.ok) {
      lines.push(`  [PASS] ${s.id}`);
    } else {
      failures += 1;
      lines.push(`  [FAIL] ${s.id}`);
      if (result.diff) {
        for (const line of result.diff.split('\n')) lines.push(`    ${line}`);
      }
    }
  }

  lines.push('');
  lines.push(`  Total: ${SNAPSHOTS.length}; failures: ${failures}`);
  if (failures > 0) {
    lines.push('');
    lines.push(
      '  To regenerate snapshots after an intentional template change,'
    );
    lines.push('  see scripts/harness/evals/cli-snapshots/README.md.');
  }

  process.stdout.write(`${lines.join('\n')}\n`);
  if (failures > 0) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

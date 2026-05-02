#!/usr/bin/env node
/**
 * Builder eval runner.
 *
 * Loads case files from `cases/{regression,negative-scope,adversarial}/*.json`,
 * validates shape, prints a coverage summary. Subagent invocation lands when
 * controller dispatch ships; for now this is a structural stub.
 *
 * Run: pnpm tsx scripts/harness/evals/builder/run.ts
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

type Status = 'success' | 'spec_gap' | 'verify_fail' | 'budget_exceeded';

interface BuilderCase {
  case_id: string;
  task_id: string;
  source: string;
  input: {
    rendered_builder_input_path: string;
  };
  expected: {
    status: Status;
    files_touched_pattern?: string;
    spec_gap_pattern?: string;
    notes_pattern?: string;
  };
  actual_baseline?: {
    status: Status;
    commit_sha?: string;
    files_touched?: string[];
    notes?: string;
  };
  notes?: string;
}

const VALID_STATUSES: ReadonlySet<Status> = new Set([
  'success',
  'spec_gap',
  'verify_fail',
  'budget_exceeded',
]);

const CASES_ROOT = resolve(__dirname, 'cases');
const REPO_ROOT = resolve(__dirname, '../../../..');
const SUITES = ['regression', 'negative-scope', 'adversarial'] as const;

export function loadCases(suite: string): BuilderCase[] {
  const dir = resolve(CASES_ROOT, suite);
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const cases: BuilderCase[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const raw = readFileSync(resolve(dir, entry), 'utf8');
    const parsed = JSON.parse(raw) as BuilderCase;
    if (!parsed.case_id) {
      throw new Error(`case file ${entry} is missing 'case_id'`);
    }
    if (!parsed.expected || !VALID_STATUSES.has(parsed.expected.status)) {
      throw new Error(
        `case ${parsed.case_id} has invalid expected.status ('${parsed.expected?.status}')`
      );
    }
    if (!parsed.input?.rendered_builder_input_path) {
      throw new Error(
        `case ${parsed.case_id} is missing input.rendered_builder_input_path`
      );
    }
    const inputPath = resolve(
      REPO_ROOT,
      parsed.input.rendered_builder_input_path
    );
    if (!existsSync(inputPath)) {
      throw new Error(
        `case ${parsed.case_id} references missing input file: ${parsed.input.rendered_builder_input_path}`
      );
    }
    if (
      parsed.expected.status === 'success' &&
      !parsed.expected.files_touched_pattern
    ) {
      throw new Error(
        `case ${parsed.case_id} status=success requires expected.files_touched_pattern`
      );
    }
    if (
      parsed.expected.status === 'spec_gap' &&
      !parsed.expected.spec_gap_pattern
    ) {
      throw new Error(
        `case ${parsed.case_id} status=spec_gap requires expected.spec_gap_pattern`
      );
    }
    cases.push(parsed);
  }
  return cases;
}

function describeStatuses(cases: BuilderCase[]): Record<Status, number> {
  const counts: Record<Status, number> = {
    success: 0,
    spec_gap: 0,
    verify_fail: 0,
    budget_exceeded: 0,
  };
  for (const c of cases) counts[c.expected.status] += 1;
  return counts;
}

function compilePattern(pattern: string): RegExp {
  if (pattern.startsWith('(?i)')) {
    return new RegExp(pattern.slice(4), 'i');
  }
  return new RegExp(pattern);
}

/**
 * Returns true iff the actual builder output matches the expected case shape.
 * Exported so the future automated runner can use the same matching logic.
 */
export function builderOutputMatches(
  actual: {
    status: Status;
    files_touched?: string[];
    spec_gap?: { gap_description?: string; suggested_amendment?: string };
    notes?: string;
  },
  expected: BuilderCase['expected']
): boolean {
  if (actual.status !== expected.status) return false;
  if (actual.status === 'success' && expected.files_touched_pattern) {
    const haystack = (actual.files_touched ?? []).join('\n');
    if (!compilePattern(expected.files_touched_pattern).test(haystack)) {
      return false;
    }
  }
  if (actual.status === 'spec_gap' && expected.spec_gap_pattern) {
    const haystack = [
      actual.spec_gap?.gap_description ?? '',
      actual.spec_gap?.suggested_amendment ?? '',
    ].join('\n');
    if (!compilePattern(expected.spec_gap_pattern).test(haystack)) {
      return false;
    }
  }
  if (expected.notes_pattern) {
    if (!compilePattern(expected.notes_pattern).test(actual.notes ?? '')) {
      return false;
    }
  }
  return true;
}

function main(): void {
  const lines: string[] = [];
  lines.push('Builder eval suite — loaded case summary');
  lines.push('');

  let totalCases = 0;
  for (const suite of SUITES) {
    const cases = loadCases(suite);
    totalCases += cases.length;
    const s = describeStatuses(cases);
    lines.push(
      `  [${suite.padEnd(15)}] ${String(cases.length).padStart(3)} cases  ` +
        `statuses: ${s.success}ok/${s.spec_gap}gap/${s.verify_fail}vfail/${s.budget_exceeded}bx`
    );
    for (const c of cases) {
      const sourceLabel =
        c.source.length > 60 ? `${c.source.slice(0, 57)}...` : c.source;
      lines.push(`    - ${c.case_id} — ${sourceLabel}`);
    }
  }

  lines.push('');
  lines.push(`  Total cases: ${totalCases}`);
  lines.push('');
  lines.push(
    '  Subagent invocation NOT yet wired — this runner currently validates'
  );
  lines.push(
    '  case-file shape only. Real eval lands when controller dispatch ships.'
  );
  lines.push('');
  lines.push('  Pass thresholds (per architecture plan §11):');
  lines.push(
    '    - regression:    status matches; files_touched / spec_gap pattern matches'
  );
  lines.push(
    '    - negative-scope: builder escalates instead of expanding scope'
  );
  lines.push('    - adversarial:    correct escalation trigger fires');

  process.stdout.write(`${lines.join('\n')}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

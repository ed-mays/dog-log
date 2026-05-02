#!/usr/bin/env node
/**
 * Drift-arbiter eval runner.
 *
 * Loads case files from `cases/{regression,negative-scope,adversarial}/*.json`,
 * validates shape, prints a coverage summary. Subagent invocation lands when
 * controller dispatch ships; for now this is a structural stub.
 *
 * Run: pnpm tsx scripts/harness/evals/drift-arbiter/run.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

type Verdict = 'amend_spec' | 'amend_design' | 'amend_task' | 'pushback';

interface DriftArbiterCase {
  case_id: string;
  task_id: string;
  source: string;
  input: {
    spec_gap: {
      task_id: string;
      cited_section: string | string[];
      gap_description: string;
      suggested_amendment?: string;
      files_inspected?: string[];
    };
  };
  expected: {
    verdict: Verdict;
    amendment?: {
      file: '01-spec.md' | '02-design.md' | '03-tasks.md';
      anchor_pattern: string;
      before_pattern: string;
      after_pattern: string;
      changelog_entry_pattern: string;
    };
    pushback_pattern?: string;
  };
  notes?: string;
}

const VALID_VERDICTS: ReadonlySet<Verdict> = new Set([
  'amend_spec',
  'amend_design',
  'amend_task',
  'pushback',
]);

const VALID_FILES: ReadonlySet<string> = new Set([
  '01-spec.md',
  '02-design.md',
  '03-tasks.md',
]);

const ROOT = resolve(__dirname, 'cases');
const SUITES = ['regression', 'negative-scope', 'adversarial'] as const;

function loadCases(suite: string): DriftArbiterCase[] {
  const dir = resolve(ROOT, suite);
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const cases: DriftArbiterCase[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const raw = readFileSync(resolve(dir, entry), 'utf8');
    const parsed = JSON.parse(raw) as DriftArbiterCase;
    if (!parsed.case_id) {
      throw new Error(`case file ${entry} is missing 'case_id'`);
    }
    if (!parsed.expected || !VALID_VERDICTS.has(parsed.expected.verdict)) {
      throw new Error(
        `case ${parsed.case_id} has invalid expected.verdict ('${parsed.expected?.verdict}')`
      );
    }
    if (parsed.expected.verdict === 'pushback') {
      if (!parsed.expected.pushback_pattern) {
        throw new Error(
          `case ${parsed.case_id} verdict=pushback requires expected.pushback_pattern`
        );
      }
    } else {
      if (!parsed.expected.amendment) {
        throw new Error(
          `case ${parsed.case_id} verdict=${parsed.expected.verdict} requires expected.amendment`
        );
      }
      if (!VALID_FILES.has(parsed.expected.amendment.file)) {
        throw new Error(
          `case ${parsed.case_id} has invalid amendment.file ('${parsed.expected.amendment.file}')`
        );
      }
    }
    cases.push(parsed);
  }
  return cases;
}

function describeVerdicts(cases: DriftArbiterCase[]): Record<Verdict, number> {
  const counts: Record<Verdict, number> = {
    amend_spec: 0,
    amend_design: 0,
    amend_task: 0,
    pushback: 0,
  };
  for (const c of cases) counts[c.expected.verdict] += 1;
  return counts;
}

/**
 * Returns true iff the actual verdict matches the expected verdict, AND the
 * actual amendment (if any) matches the expected regex patterns.
 *
 * Exported so the future automated runner can use the same matching logic.
 */
/**
 * Compiles a pattern that may use the `(?i)` PCRE-style inline flag (which
 * JavaScript's RegExp does not support natively) into a `RegExp` with the
 * native `i` flag. This lets case files use the same `(?i)` convention the
 * cold-reader cases use.
 */
function compilePattern(pattern: string): RegExp {
  if (pattern.startsWith('(?i)')) {
    return new RegExp(pattern.slice(4), 'i');
  }
  return new RegExp(pattern);
}

export function arbiterOutputMatches(
  actual: {
    verdict: Verdict;
    amendment?: {
      file: string;
      anchor: string;
      before: string;
      after: string;
      changelog_entry: string;
    };
    pushback_clarification?: string;
  },
  expected: DriftArbiterCase['expected']
): boolean {
  if (actual.verdict !== expected.verdict) return false;
  if (actual.verdict === 'pushback') {
    if (!expected.pushback_pattern) return true;
    return compilePattern(expected.pushback_pattern).test(
      actual.pushback_clarification ?? ''
    );
  }
  if (!expected.amendment || !actual.amendment) return false;
  if (actual.amendment.file !== expected.amendment.file) return false;
  if (
    !compilePattern(expected.amendment.anchor_pattern).test(
      actual.amendment.anchor
    )
  ) {
    return false;
  }
  if (
    expected.amendment.before_pattern &&
    !compilePattern(expected.amendment.before_pattern).test(
      actual.amendment.before
    )
  ) {
    return false;
  }
  if (
    !compilePattern(expected.amendment.after_pattern).test(
      actual.amendment.after
    )
  ) {
    return false;
  }
  if (
    !compilePattern(expected.amendment.changelog_entry_pattern).test(
      actual.amendment.changelog_entry
    )
  ) {
    return false;
  }
  return true;
}

function main(): void {
  const lines: string[] = [];
  lines.push('Drift-arbiter eval suite — loaded case summary');
  lines.push('');

  let totalCases = 0;
  for (const suite of SUITES) {
    const cases = loadCases(suite);
    totalCases += cases.length;
    const v = describeVerdicts(cases);
    lines.push(
      `  [${suite.padEnd(15)}] ${String(cases.length).padStart(3)} cases  ` +
        `verdicts: ${v.amend_spec}aS/${v.amend_design}aD/${v.amend_task}aT/${v.pushback}p`
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
    '    - regression:    ≥80% verdict accuracy; amendment patterns match'
  );
  lines.push(
    '    - negative-scope: pushback emitted for misread cases; minimal-blast amendments otherwise'
  );
  lines.push('    - adversarial:    upstream artifact picked when ambiguous');

  process.stdout.write(`${lines.join('\n')}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

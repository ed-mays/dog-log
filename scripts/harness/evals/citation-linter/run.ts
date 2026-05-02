#!/usr/bin/env node
/**
 * Citation-linter eval runner.
 *
 * Loads case files from `cases/{regression,negative-scope,adversarial}/*.json`,
 * validates shape, runs the linter against each case's input, prints a
 * coverage + pass/fail summary. Unlike the LLM-agent runners, the linter is
 * pure code so we run it in-process at zero token cost. Exits 1 if any case
 * mismatches.
 *
 * Run: pnpm tsx scripts/harness/evals/citation-linter/run.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type LintResult, lintCommitMessage } from '../../lib/citation-linter';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface CitationLinterCase {
  case_id: string;
  source: string;
  input: { commit_message: string };
  expected: {
    valid: boolean;
    exempt_reason_pattern?: string;
    citations_must_include?: string[];
    failure_reason_pattern?: string;
  };
  notes?: string;
}

const CASES_ROOT = resolve(__dirname, 'cases');
const SUITES = ['regression', 'negative-scope', 'adversarial'] as const;

function compilePattern(pattern: string): RegExp {
  if (pattern.startsWith('(?i)')) {
    return new RegExp(pattern.slice(4), 'i');
  }
  return new RegExp(pattern);
}

export function loadCases(suite: string): CitationLinterCase[] {
  const dir = resolve(CASES_ROOT, suite);
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const cases: CitationLinterCase[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const raw = readFileSync(resolve(dir, entry), 'utf8');
    const parsed = JSON.parse(raw) as CitationLinterCase;
    if (!parsed.case_id) {
      throw new Error(`case file ${entry} is missing 'case_id'`);
    }
    if (typeof parsed.expected?.valid !== 'boolean') {
      throw new Error(
        `case ${parsed.case_id} requires expected.valid (boolean)`
      );
    }
    if (!parsed.input?.commit_message) {
      throw new Error(`case ${parsed.case_id} requires input.commit_message`);
    }
    if (
      parsed.expected.valid === false &&
      !parsed.expected.failure_reason_pattern
    ) {
      throw new Error(
        `case ${parsed.case_id} valid=false requires expected.failure_reason_pattern`
      );
    }
    cases.push(parsed);
  }
  return cases;
}

/**
 * Returns true iff the actual linter result matches the expected case shape.
 * Exported so other runners can compose this matcher if needed.
 */
export function linterOutputMatches(
  actual: LintResult,
  expected: CitationLinterCase['expected']
): { ok: boolean; reason?: string } {
  if (actual.valid !== expected.valid) {
    return {
      ok: false,
      reason: `valid mismatch: got ${actual.valid}, expected ${expected.valid}`,
    };
  }
  if (expected.exempt_reason_pattern) {
    if (!actual.exemptReason) {
      return { ok: false, reason: `expected exempt_reason but got none` };
    }
    if (
      !compilePattern(expected.exempt_reason_pattern).test(actual.exemptReason)
    ) {
      return {
        ok: false,
        reason: `exempt_reason '${actual.exemptReason}' does not match pattern '${expected.exempt_reason_pattern}'`,
      };
    }
  }
  if (expected.citations_must_include) {
    for (const required of expected.citations_must_include) {
      if (!actual.citations.includes(required)) {
        return {
          ok: false,
          reason: `citations missing '${required}' (got: ${actual.citations.join(', ') || '<none>'})`,
        };
      }
    }
  }
  if (expected.failure_reason_pattern) {
    if (!actual.failureReason) {
      return { ok: false, reason: `expected failure_reason but got none` };
    }
    if (
      !compilePattern(expected.failure_reason_pattern).test(
        actual.failureReason
      )
    ) {
      return {
        ok: false,
        reason: `failure_reason does not match pattern '${expected.failure_reason_pattern}'`,
      };
    }
  }
  return { ok: true };
}

interface SuiteResult {
  suite: string;
  total: number;
  passed: number;
  failures: { case_id: string; reason: string }[];
}

export function runSuite(suite: string): SuiteResult {
  const cases = loadCases(suite);
  const failures: { case_id: string; reason: string }[] = [];
  for (const c of cases) {
    const actual = lintCommitMessage(c.input.commit_message);
    const result = linterOutputMatches(actual, c.expected);
    if (!result.ok) {
      failures.push({ case_id: c.case_id, reason: result.reason ?? 'unknown' });
    }
  }
  return {
    suite,
    total: cases.length,
    passed: cases.length - failures.length,
    failures,
  };
}

function main(): void {
  const lines: string[] = [];
  lines.push('Citation-linter eval suite — in-process run');
  lines.push('');

  let totalCases = 0;
  let totalFailures = 0;

  for (const suite of SUITES) {
    const result = runSuite(suite);
    totalCases += result.total;
    totalFailures += result.failures.length;
    const status = result.failures.length === 0 ? 'PASS' : 'FAIL';
    lines.push(
      `  [${suite.padEnd(15)}] ${String(result.total).padStart(3)} cases  ${result.passed}/${result.total} ${status}`
    );
    for (const f of result.failures) {
      lines.push(`    ✗ ${f.case_id}: ${f.reason}`);
    }
  }

  lines.push('');
  lines.push(`  Total cases: ${totalCases}; failures: ${totalFailures}`);
  lines.push('');
  lines.push('  Pass thresholds: 100% per suite (linter is pure code).');

  process.stdout.write(`${lines.join('\n')}\n`);
  if (totalFailures > 0) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

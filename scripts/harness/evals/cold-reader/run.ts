#!/usr/bin/env node
/**
 * Cold-reader eval runner.
 *
 * Loads case files from `cases/{regression,negative-scope,adversarial}/*.json`
 * and prints what the runner WOULD test against. Subagent invocation lands
 * in MVP step 6 (or wherever we wire dispatch); for now this is a structural
 * stub that validates case-file shape and prints a coverage summary.
 *
 * Run: pnpm tsx scripts/harness/evals/cold-reader/run.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * `cited_section` may be a single string OR an array of strings. The array
 * form lists *acceptable alternatives*: actual cold-reader output matches
 * the expected finding if its `cited_section` equals any of the listed
 * strings. This handles cases where two equally-valid spec citations could
 * describe the same finding (e.g. a verify-line-rooted finding that could
 * cite either `BR-15` or `§5`).
 */
interface ColdReaderCase {
  case_id: string;
  artifact_kind: 'code' | 'prose';
  task_id: string;
  source: string;
  input: Record<string, unknown>;
  expected: {
    verdict: 'approve' | 'veto';
    findings: Array<{
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      scope_check: 1 | 2 | 3 | 4 | 5;
      cited_section: string | string[];
      evidence_pattern: string;
      description_pattern: string;
    }>;
  };
  notes?: string;
}

/** Citation tokens accepted by the cold-reader prompt. The runner validates
 *  every expected `cited_section` value against this set so that fixture
 *  authoring stays in sync with the prompt's grammar. */
const VALID_CITATION_RE = /^(?:BR|NFR|AC|US|OQ|DQ)-\d+$|^§D?\d+$/;

const ROOT = resolve(__dirname, 'cases');
const SUITES = ['regression', 'negative-scope', 'adversarial'] as const;

function loadCases(suite: string): ColdReaderCase[] {
  const dir = resolve(ROOT, suite);
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const cases: ColdReaderCase[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const raw = readFileSync(resolve(dir, entry), 'utf8');
    const parsed = JSON.parse(raw) as ColdReaderCase;
    if (!parsed.case_id) {
      throw new Error(`case file ${entry} is missing required field 'case_id'`);
    }
    if (!parsed.expected || !parsed.expected.verdict) {
      throw new Error(
        `case ${parsed.case_id} is missing required field 'expected.verdict'`
      );
    }
    for (const f of parsed.expected.findings) {
      const cites = Array.isArray(f.cited_section)
        ? f.cited_section
        : [f.cited_section];
      for (const c of cites) {
        if (!VALID_CITATION_RE.test(c)) {
          throw new Error(
            `case ${parsed.case_id} has invalid cited_section '${c}' — must match BR-N, NFR-N, AC-N, US-N, OQ-N, DQ-N, §N, or §DN`
          );
        }
      }
    }
    cases.push(parsed);
  }
  return cases;
}

/**
 * Returns true iff the actual `cited_section` from a cold-reader finding
 * matches the expected `cited_section` from a case file. The expected form
 * may be a single string OR an array of acceptable alternatives.
 */
export function citationMatches(
  actual: string,
  expected: string | string[]
): boolean {
  const allowed = Array.isArray(expected) ? expected : [expected];
  return allowed.includes(actual);
}

function describeSeverity(cases: ColdReaderCase[]): Record<string, number> {
  const counts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const c of cases) {
    for (const f of c.expected.findings) {
      counts[f.severity] = (counts[f.severity] ?? 0) + 1;
    }
  }
  return counts;
}

function main(): void {
  const lines: string[] = [];
  lines.push('Cold-reader eval suite — loaded case summary');
  lines.push('');

  let totalCases = 0;
  for (const suite of SUITES) {
    const cases = loadCases(suite);
    totalCases += cases.length;
    const sev = describeSeverity(cases);
    const kinds = new Set(cases.map((c) => c.artifact_kind));

    lines.push(
      `  [${suite.padEnd(15)}] ${String(cases.length).padStart(3)} cases ` +
        `(kinds: ${[...kinds].join(',') || '—'})  ` +
        `findings: ${sev.CRITICAL}C/${sev.HIGH}H/${sev.MEDIUM}M/${sev.LOW}L`
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
    '  case-file shape only. Real eval lands when MVP step 6 ships dispatch.'
  );
  lines.push('');
  lines.push('  Pass thresholds (per architecture plan §5):');
  lines.push(
    '    - regression:    ≥80% recall on CRITICAL/HIGH; ≥70% precision'
  );
  lines.push('    - negative-scope: zero CRITICAL/HIGH emitted');
  lines.push('    - adversarial:    catches the buried CRITICAL');

  process.stdout.write(`${lines.join('\n')}\n`);
}

// Only run main() when this file is the entry point — avoids side effects
// when the module is imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

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
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
      cited_section: string;
      evidence_pattern: string;
      description_pattern: string;
    }>;
  };
  notes?: string;
}

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
    cases.push(parsed);
  }
  return cases;
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
      lines.push(`    - ${c.case_id} (${basename(c.source)})`);
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

main();

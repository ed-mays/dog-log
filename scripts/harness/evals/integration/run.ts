#!/usr/bin/env node
/**
 * Integration trajectory eval runner.
 *
 * Validates that each trajectory case's referenced per-agent fixtures and
 * file paths exist and parse cleanly. Does NOT re-execute the trajectory —
 * controller dispatch (when it lands) becomes the integration runner.
 *
 * Run: pnpm tsx scripts/harness/evals/integration/run.ts
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');

type Agent = 'builder' | 'cold-reader' | 'drift-arbiter' | 'human';

interface TrajectoryStep {
  step: number;
  round: number;
  agent: Agent;
  case_ref: string;
  outcome: string;
  notes?: string;
}

interface TrajectoryCase {
  case_id: string;
  task_id: string;
  title: string;
  description: string;
  steps: TrajectoryStep[];
  expected_full_loop: string;
  validation: string;
}

const CASES_DIR = resolve(__dirname, 'cases');
const VALID_AGENTS: ReadonlySet<Agent> = new Set([
  'builder',
  'cold-reader',
  'drift-arbiter',
  'human',
]);

export function loadCases(): TrajectoryCase[] {
  let entries: string[];
  try {
    entries = readdirSync(CASES_DIR);
  } catch {
    return [];
  }
  const cases: TrajectoryCase[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const raw = readFileSync(resolve(CASES_DIR, entry), 'utf8');
    const parsed = JSON.parse(raw) as TrajectoryCase;
    if (!parsed.case_id) {
      throw new Error(`case file ${entry} missing 'case_id'`);
    }
    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      throw new Error(`case ${parsed.case_id} requires non-empty 'steps'`);
    }
    for (const s of parsed.steps) {
      if (!VALID_AGENTS.has(s.agent)) {
        throw new Error(
          `case ${parsed.case_id} step ${s.step} has invalid agent '${s.agent}'`
        );
      }
    }
    cases.push(parsed);
  }
  return cases;
}

interface ValidationResult {
  case_id: string;
  ok: boolean;
  missing: string[];
}

/**
 * Verifies every step's `case_ref` either resolves to an existing file
 * (when it ends with .json) OR is a free-form description (e.g. "PR #160").
 * Free-form references are accepted as-is — they describe historical
 * artifacts (commits, PRs) that aren't files in this repo.
 */
export function validateCase(c: TrajectoryCase): ValidationResult {
  const missing: string[] = [];
  for (const s of c.steps) {
    if (!s.case_ref.endsWith('.json')) continue;
    const fullPath = resolve(REPO_ROOT, s.case_ref);
    if (!existsSync(fullPath)) {
      missing.push(`step ${s.step}: ${s.case_ref}`);
    }
  }
  return { case_id: c.case_id, ok: missing.length === 0, missing };
}

function main(): void {
  const cases = loadCases();
  const lines: string[] = [];
  lines.push('Integration trajectory eval — load + cross-reference check');
  lines.push('');

  let failures = 0;
  for (const c of cases) {
    const result = validateCase(c);
    if (result.ok) {
      lines.push(`  [PASS] ${c.case_id} — ${c.steps.length} steps`);
    } else {
      failures += 1;
      lines.push(`  [FAIL] ${c.case_id}`);
      for (const m of result.missing) lines.push(`    ✗ missing: ${m}`);
    }
  }

  lines.push('');
  lines.push(`  Total trajectories: ${cases.length}; failures: ${failures}`);

  process.stdout.write(`${lines.join('\n')}\n`);
  if (failures > 0) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

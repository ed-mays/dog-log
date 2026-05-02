import { describe, expect, it } from 'vitest';
import { loadCases, validateCase } from './run';

describe('integration trajectory eval — loadCases', () => {
  it('loads at least one trajectory case', () => {
    const cases = loadCases();
    expect(cases.length).toBeGreaterThan(0);
  });

  it('loads the T-01 loop closure trajectory', () => {
    const cases = loadCases();
    const ids = cases.map((c) => c.case_id);
    expect(ids).toContain('trajectory-T-01-loop-closure');
  });

  it('every trajectory has at least one step', () => {
    const cases = loadCases();
    for (const c of cases) {
      expect(c.steps.length).toBeGreaterThan(0);
    }
  });
});

describe('integration trajectory eval — validateCase', () => {
  it('passes for every loaded trajectory (no broken references)', () => {
    const cases = loadCases();
    for (const c of cases) {
      const result = validateCase(c);
      expect(result.missing).toEqual([]);
      expect(result.ok).toBe(true);
    }
  });

  it('detects a missing case_ref', () => {
    const fake = {
      case_id: 'fake',
      task_id: 'T-99',
      title: 'fake',
      description: 'fake',
      steps: [
        {
          step: 1,
          round: 99,
          agent: 'builder' as const,
          case_ref:
            'scripts/harness/evals/builder/cases/regression/does-not-exist.json',
          outcome: 'success',
        },
      ],
      expected_full_loop: 'fake',
      validation: 'fake',
    };
    const result = validateCase(fake);
    expect(result.ok).toBe(false);
    expect(result.missing.length).toBe(1);
  });

  it('accepts free-form (non-.json) case_refs as historical artifacts', () => {
    const fake = {
      case_id: 'fake',
      task_id: 'T-99',
      title: 'fake',
      description: 'fake',
      steps: [
        {
          step: 1,
          round: 99,
          agent: 'human' as const,
          case_ref: 'PR #160 (commit abc123)',
          outcome: 'merged',
        },
      ],
      expected_full_loop: 'fake',
      validation: 'fake',
    };
    const result = validateCase(fake);
    expect(result.ok).toBe(true);
  });
});

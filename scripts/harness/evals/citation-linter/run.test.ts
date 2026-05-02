import { describe, expect, it } from 'vitest';
import { lintCommitMessage } from '../../lib/citation-linter';
import { linterOutputMatches, loadCases, runSuite } from './run';

describe('citation-linter eval — case loading', () => {
  it('loads the round-12 adversarial case', () => {
    const cases = loadCases('adversarial');
    const ids = cases.map((c) => c.case_id);
    expect(ids).toContain('adversarial-round-12-skip-cite-in-help-text');
  });

  it('all loaded cases have a non-empty commit_message', () => {
    for (const suite of [
      'regression',
      'negative-scope',
      'adversarial',
    ] as const) {
      const cases = loadCases(suite);
      for (const c of cases) {
        expect(c.input.commit_message.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('citation-linter eval — runSuite', () => {
  it('round-12 adversarial case passes against the current linter', () => {
    const result = runSuite('adversarial');
    const failedRound12 = result.failures.find((f) =>
      f.case_id.includes('round-12')
    );
    expect(failedRound12).toBeUndefined();
  });

  it('all suites pass against the current linter (no regressions)', () => {
    for (const suite of [
      'regression',
      'negative-scope',
      'adversarial',
    ] as const) {
      const result = runSuite(suite);
      expect(result.failures).toEqual([]);
    }
  });
});

describe('linterOutputMatches', () => {
  it('matches when valid + exempt_reason pattern align', () => {
    const actual = lintCommitMessage('chore: bump version');
    expect(
      linterOutputMatches(actual, {
        valid: true,
        exempt_reason_pattern: "(?i)exempt commit type 'chore'",
      })
    ).toEqual({ ok: true });
  });

  it('rejects when exempt_reason pattern does not match', () => {
    const actual = lintCommitMessage('chore: bump version');
    const result = linterOutputMatches(actual, {
      valid: true,
      exempt_reason_pattern: "(?i)scope 'harness'",
    });
    expect(result.ok).toBe(false);
  });

  it('rejects when valid mismatches', () => {
    const actual = lintCommitMessage('chore: bump');
    const result = linterOutputMatches(actual, {
      valid: false,
      failure_reason_pattern: '(?i)no spec',
    });
    expect(result.ok).toBe(false);
  });

  it('verifies citations_must_include', () => {
    const actual = lintCommitMessage('feat: do thing (BR-7)');
    expect(
      linterOutputMatches(actual, {
        valid: true,
        citations_must_include: ['BR-7'],
      })
    ).toEqual({ ok: true });
    const missing = linterOutputMatches(actual, {
      valid: true,
      citations_must_include: ['BR-99'],
    });
    expect(missing.ok).toBe(false);
  });
});

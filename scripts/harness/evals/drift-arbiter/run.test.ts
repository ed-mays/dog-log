import { describe, expect, it } from 'vitest';
import { arbiterOutputMatches } from './run';

const baseAmendment = {
  file: '03-tasks.md' as const,
  anchor: 'T-01 Verify line',
  before: 'pnpm exec tsc -b passes with the new file imported nowhere.',
  after:
    "pnpm exec tsc -b passes. (TDD does not apply to type-only foundation tasks; types are exercised by their first consumer's tests.)",
  changelog_entry:
    '2026-05-01 — Resolved spec_gap from T-01: relaxed verify line to permit type-only tasks; explicit TDD waiver for files that have no behavioral ACs.',
};

describe('arbiterOutputMatches — amend_task verdict', () => {
  const expected = {
    verdict: 'amend_task' as const,
    amendment: {
      file: '03-tasks.md' as const,
      anchor_pattern: 'T-01',
      before_pattern: '(?i)tsc -b.*imported nowhere|Verify',
      after_pattern: '(?i)tsc -b passes|TDD does not apply|type-only|no ACs',
      changelog_entry_pattern: '(?i)T-01|TDD|verify line|type-only',
    },
  };

  it('matches when verdict + all patterns align', () => {
    expect(
      arbiterOutputMatches(
        { verdict: 'amend_task', amendment: baseAmendment },
        expected
      )
    ).toBe(true);
  });

  it('rejects mismatched verdict', () => {
    expect(
      arbiterOutputMatches(
        { verdict: 'amend_spec', amendment: baseAmendment },
        expected
      )
    ).toBe(false);
  });

  it('rejects mismatched file', () => {
    expect(
      arbiterOutputMatches(
        {
          verdict: 'amend_task',
          amendment: { ...baseAmendment, file: '01-spec.md' },
        },
        expected
      )
    ).toBe(false);
  });

  it('rejects when after text does not match the required phrasing', () => {
    expect(
      arbiterOutputMatches(
        {
          verdict: 'amend_task',
          amendment: { ...baseAmendment, after: 'something completely else' },
        },
        expected
      )
    ).toBe(false);
  });

  it('rejects when changelog entry does not match', () => {
    expect(
      arbiterOutputMatches(
        {
          verdict: 'amend_task',
          amendment: {
            ...baseAmendment,
            changelog_entry: 'unrelated entry text',
          },
        },
        expected
      )
    ).toBe(false);
  });

  it('rejects when amendment is missing entirely', () => {
    expect(arbiterOutputMatches({ verdict: 'amend_task' }, expected)).toBe(
      false
    );
  });
});

describe('arbiterOutputMatches — pushback verdict', () => {
  const expected = {
    verdict: 'pushback' as const,
    pushback_pattern: '(?i)misread|already covered|see BR-3',
  };

  it('matches when pushback clarification matches the pattern', () => {
    expect(
      arbiterOutputMatches(
        {
          verdict: 'pushback',
          pushback_clarification: 'You misread BR-3; it already covers this.',
        },
        expected
      )
    ).toBe(true);
  });

  it('rejects when pushback clarification does not match', () => {
    expect(
      arbiterOutputMatches(
        { verdict: 'pushback', pushback_clarification: 'unrelated text' },
        expected
      )
    ).toBe(false);
  });

  it('passes when no pushback_pattern is specified (any pushback OK)', () => {
    const exp = { verdict: 'pushback' as const };
    expect(
      arbiterOutputMatches(
        { verdict: 'pushback', pushback_clarification: 'whatever' },
        exp
      )
    ).toBe(true);
  });
});

describe('arbiterOutputMatches — empty before pattern (pure addition)', () => {
  it('skips before-pattern check when expected.before_pattern is empty', () => {
    const expected = {
      verdict: 'amend_spec' as const,
      amendment: {
        file: '01-spec.md' as const,
        anchor_pattern: '§4',
        before_pattern: '',
        after_pattern: '(?i)BR-99',
        changelog_entry_pattern: '(?i)added BR-99',
      },
    };
    expect(
      arbiterOutputMatches(
        {
          verdict: 'amend_spec',
          amendment: {
            file: '01-spec.md',
            anchor: '§4',
            before: '',
            after: '- **BR-99** — new behavior.',
            changelog_entry:
              '2026-05-01 — added BR-99 to resolve spec_gap from T-XX',
          },
        },
        expected
      )
    ).toBe(true);
  });
});

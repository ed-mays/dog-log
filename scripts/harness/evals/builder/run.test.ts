import { describe, expect, it } from 'vitest';
import { builderOutputMatches, loadCases } from './run';

describe('builderOutputMatches — success status', () => {
  const expected = {
    status: 'success' as const,
    files_touched_pattern: 'src/features/incidents/types\\.ts',
    notes_pattern: '(?i)TDD.*waived|type-only|slice 0',
  };

  it('matches when status + files_touched + notes align', () => {
    expect(
      builderOutputMatches(
        {
          status: 'success',
          files_touched: ['src/features/incidents/types.ts'],
          notes:
            'Slice 0 foundation. TDD-first is waived per task Notes; types-only file.',
        },
        expected
      )
    ).toBe(true);
  });

  it('rejects mismatched status', () => {
    expect(
      builderOutputMatches(
        {
          status: 'spec_gap',
          files_touched: ['src/features/incidents/types.ts'],
          notes: 'TDD waived; slice 0',
        },
        expected
      )
    ).toBe(false);
  });

  it('rejects when files_touched does not include the expected path', () => {
    expect(
      builderOutputMatches(
        {
          status: 'success',
          files_touched: ['src/features/medications/types.ts'],
          notes: 'TDD waived; slice 0',
        },
        expected
      )
    ).toBe(false);
  });

  it('rejects when notes do not match the expected pattern', () => {
    expect(
      builderOutputMatches(
        {
          status: 'success',
          files_touched: ['src/features/incidents/types.ts'],
          notes: 'just shipped it',
        },
        expected
      )
    ).toBe(false);
  });
});

describe('builderOutputMatches — spec_gap status', () => {
  const expected = {
    status: 'spec_gap' as const,
    spec_gap_pattern:
      '(?i)TDD.*conflict|verify line.*structural|imported nowhere',
  };

  it('matches when spec_gap description hits the pattern', () => {
    expect(
      builderOutputMatches(
        {
          status: 'spec_gap',
          spec_gap: {
            gap_description:
              'TDD rule and verify line conflict; verify line is structural (imported nowhere).',
            suggested_amendment:
              'Either relax verify or waive TDD for type-only.',
          },
        },
        expected
      )
    ).toBe(true);
  });

  it('rejects when neither description nor amendment matches the pattern', () => {
    expect(
      builderOutputMatches(
        {
          status: 'spec_gap',
          spec_gap: {
            gap_description: 'something unrelated',
            suggested_amendment: 'something else',
          },
        },
        expected
      )
    ).toBe(false);
  });
});

describe('loadCases — regression suite', () => {
  it('loads the T-01-V2-amended regression case cleanly', () => {
    const cases = loadCases('regression');
    const ids = cases.map((c) => c.case_id);
    expect(ids).toContain('regression-T-01-V2-amended');
  });

  it('all regression cases have a baseline captured', () => {
    const cases = loadCases('regression');
    for (const c of cases) {
      expect(c.actual_baseline?.status).toBeDefined();
    }
  });
});

import { describe, it, expect } from 'vitest';
import { normalizePhone, normalizeName } from './phone';

describe('normalizePhone', () => {
  it('returns empty string for falsy input', () => {
    expect(normalizePhone('')).toBe('');
  });

  it('keeps leading + and strips non-digits', () => {
    expect(normalizePhone('+1 (555) 111-2222')).toBe('+15551112222');
  });

  it('adds +1 for 10-digit US numbers', () => {
    expect(normalizePhone('555-111-2222')).toBe('+15551112222');
  });

  it('returns digits-only when not 10 digits and no +', () => {
    // 11 digits without + should be returned as-is (no country assumption)
    expect(normalizePhone('011-44-20-7946-0958'.replace(/\D+/g, ''))).toBe(
      '011442079460958'
    );
  });
});

describe('normalizeName', () => {
  it('trims and lowercases', () => {
    expect(normalizeName('  Dr. Alice  ')).toBe('dr. alice');
  });

  it('handles undefined safely', () => {
    // @ts-expect-error intentional undefined to exercise fallback
    expect(normalizeName(undefined)).toBe('');
  });
});

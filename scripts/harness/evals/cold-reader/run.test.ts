import { describe, expect, it } from 'vitest';
import { citationMatches } from './run';

describe('citationMatches', () => {
  it('matches when actual equals a single-string expected', () => {
    expect(citationMatches('BR-7', 'BR-7')).toBe(true);
  });

  it('does not match when actual differs from a single-string expected', () => {
    expect(citationMatches('BR-7', 'BR-8')).toBe(false);
  });

  it('matches when actual is one of an array of acceptable alternatives', () => {
    expect(citationMatches('§5', ['BR-15', '§5'])).toBe(true);
    expect(citationMatches('BR-15', ['BR-15', '§5'])).toBe(true);
  });

  it('does not match when actual is not among the array alternatives', () => {
    expect(citationMatches('BR-3', ['BR-15', '§5'])).toBe(false);
  });

  it('handles an empty alternatives array as no-match', () => {
    expect(citationMatches('BR-7', [])).toBe(false);
  });

  it('is case-sensitive (BR/br are different)', () => {
    expect(citationMatches('BR-7', 'br-7')).toBe(false);
  });

  it('treats §N and §DN as distinct', () => {
    expect(citationMatches('§5', '§D5')).toBe(false);
    expect(citationMatches('§D5', '§5')).toBe(false);
  });
});

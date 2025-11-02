import { describe, it, expect } from 'vitest';
import { toErrorMessage } from './errors';

describe('toErrorMessage', () => {
  it('returns empty string for null/undefined', () => {
    expect(toErrorMessage(null)).toBe('');
    expect(toErrorMessage(undefined)).toBe('');
  });

  it('returns the string as-is when input is a string', () => {
    expect(toErrorMessage('boom')).toBe('boom');
  });

  it('returns Error.message when input is an Error', () => {
    const err = new Error('things went bad');
    expect(toErrorMessage(err)).toBe('things went bad');
  });

  it('stringifies non-empty objects and returns JSON', () => {
    const msg = toErrorMessage({ a: 1, b: 'x' });
    expect(msg).toBe('{"a":1,"b":"x"}');
  });

  it('returns empty string for empty objects', () => {
    expect(toErrorMessage({})).toBe('');
  });

  it('returns empty string if JSON.stringify throws (e.g., circular)', () => {
    type Circular = { self?: unknown } & Record<string, unknown>;
    const a: Circular = {};
    a.self = a; // circular reference
    expect(toErrorMessage(a)).toBe('');
  });
});

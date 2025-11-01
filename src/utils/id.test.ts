import { describe, it, expect, beforeEach } from 'vitest';
import { generateId, setIdGenerator, resetIdGenerator } from './id';

describe('id utils', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  it('uses a deterministic generator when set', () => {
    setIdGenerator(() => 'fixed-id-123');
    expect(generateId()).toBe('fixed-id-123');
  });

  it('falls back to some non-empty id by default', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

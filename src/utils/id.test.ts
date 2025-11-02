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

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateId, setIdGenerator, resetIdGenerator } from './id';

describe('id utils (extended)', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses crypto.randomUUID when available', () => {
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'uuid-from-crypto') });
    resetIdGenerator(); // ensure default generator picks up current env
    expect(generateId()).toBe('uuid-from-crypto');
  });

  it('falls back to dashed base36 format when crypto.randomUUID is not available', () => {
    vi.stubGlobal(
      'crypto',
      undefined as unknown as { randomUUID?: () => string }
    );
    resetIdGenerator();
    const id = generateId();
    const segments = id.split('-');
    expect(segments.length).toBe(5);
    const [s1, s2, s3, s4, s5] = segments;
    // ensure lowercase base36 charset with up-to expected lengths (Math.random base36 may be shorter)
    expect(s1).toMatch(/^[a-z0-9]+$/);
    expect(s1.length).toBeGreaterThan(0);
    expect(s1.length).toBeLessThanOrEqual(8);

    expect(s2).toMatch(/^[a-z0-9]+$/);
    expect(s2.length).toBeGreaterThan(0);
    expect(s2.length).toBeLessThanOrEqual(4);

    expect(s3).toMatch(/^[a-z0-9]+$/);
    expect(s3.length).toBeGreaterThan(0);
    expect(s3.length).toBeLessThanOrEqual(4);

    expect(s4).toMatch(/^[a-z0-9]+$/);
    expect(s4.length).toBeGreaterThan(0);
    expect(s4.length).toBeLessThanOrEqual(4);

    expect(s5).toMatch(/^[a-z0-9]+$/);
    expect(s5.length).toBeGreaterThan(0);
    expect(s5.length).toBeLessThanOrEqual(12);
  });

  it('can be overridden by setIdGenerator and restored by resetIdGenerator', () => {
    setIdGenerator(() => 'fixed-id-123');
    expect(generateId()).toBe('fixed-id-123');
    resetIdGenerator();
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates reasonably unique ids (no duplicates in small sample)', () => {
    vi.stubGlobal(
      'crypto',
      undefined as unknown as { randomUUID?: () => string }
    );
    resetIdGenerator();
    const set = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const id = generateId();
      expect(set.has(id)).toBe(false);
      set.add(id);
    }
  });
});

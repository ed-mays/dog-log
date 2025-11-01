import { describe, it, expect } from 'vitest';
import {
  COLLECTIONS,
  REPOSITORY_ENV,
  FIRESTORE_OPERATORS,
  isNonEmptyString,
  buildIsArchivedFilter,
} from './config';

// Test constants
describe('COLLECTIONS', () => {
  it('should include expected collection names', () => {
    expect(COLLECTIONS.PETS).toBe('pets');
    expect(COLLECTIONS.USERS).toBe('users');
    expect(COLLECTIONS.VET_VISITS).toBe('vetVisits');
  });
});

describe('REPOSITORY_ENV', () => {
  it('should define emulator config', () => {
    expect(typeof REPOSITORY_ENV.useEmulator).toBe('boolean');
    expect(typeof REPOSITORY_ENV.emulatorHost).toBe('string');
  });
});

describe('FIRESTORE_OPERATORS', () => {
  it('should map operator keys to Firestore strings', () => {
    expect(FIRESTORE_OPERATORS.EQ).toBe('==');
    expect(FIRESTORE_OPERATORS.ARRAY_CONTAINS).toBe('array-contains');
  });
});

// Test utility functions
describe('isNonEmptyString', () => {
  it('returns true for non-empty strings', () => {
    expect(isNonEmptyString('dog')).toBe(true);
  });
  it('returns false for empty and non-string values', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(42)).toBe(false);
  });
});

describe('buildIsArchivedFilter', () => {
  it('returns correct filter object for archived', () => {
    expect(buildIsArchivedFilter(true)).toEqual({
      field: 'isArchived',
      operator: FIRESTORE_OPERATORS.EQ,
      value: true,
    });
  });
  it('returns correct filter object for not archived', () => {
    expect(buildIsArchivedFilter(false)).toEqual({
      field: 'isArchived',
      operator: FIRESTORE_OPERATORS.EQ,
      value: false,
    });
  });
});

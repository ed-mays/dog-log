import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  firestoreDocumentToPlain,
  plainToFirestoreDocument,
  sanitizeStringField,
} from './dataTransformers';

describe('firestoreDocumentToPlain', () => {
  it('converts Firestore Timestamps to JS Date', () => {
    const ts = Timestamp.fromDate(new Date('2021-01-01T00:00:00Z'));
    const doc = { createdAt: ts };
    const result = firestoreDocumentToPlain<{ createdAt: Date }>(doc);
    expect(result.createdAt).toEqual(new Date('2021-01-01T00:00:00Z'));
  });

  it('deeply converts nested Timestamps', () => {
    const ts = Timestamp.fromDate(new Date('2021-01-01T00:00:00Z'));
    const doc = { pet: { health: { lastVisit: ts } } };
    const result = firestoreDocumentToPlain<{
      pet: { health: { lastVisit: Date } };
    }>(doc);
    expect(result.pet.health.lastVisit).toEqual(
      new Date('2021-01-01T00:00:00Z')
    );
  });

  it('preserves primitives and arrays', () => {
    const doc = { name: 'Paws', tags: ['healthy', 'active'], age: 2 };
    const result = firestoreDocumentToPlain(doc);
    expect(result).toEqual(doc);
  });
});

describe('plainToFirestoreDocument', () => {
  it('converts JS Date to Firestore Timestamp', () => {
    const date = new Date('2021-01-01T00:00:00Z');
    const result = plainToFirestoreDocument({ createdAt: date });
    expect(result.createdAt).toBeInstanceOf(Timestamp);
    expect(result.createdAt.toDate()).toEqual(date);
  });

  it('deeply converts nested Dates', () => {
    const date = new Date('2021-01-01T00:00:00Z');
    const result = plainToFirestoreDocument({
      pet: { health: { lastVisit: date } },
    });
    expect(result.pet.health.lastVisit).toBeInstanceOf(Timestamp);
    expect(result.pet.health.lastVisit.toDate()).toEqual(date);
  });

  it('preserves primitives and arrays', () => {
    const obj = { name: 'Buddy', tags: ['happy', 'puppy'], age: 3 };
    const result = plainToFirestoreDocument(obj);
    expect(result).toEqual(obj);
  });
});

describe('sanitizeStringField', () => {
  it('trims whitespace from strings', () => {
    expect(sanitizeStringField(' dog ')).toBe('dog');
  });

  it('returns empty string for non-strings', () => {
    expect(sanitizeStringField(null)).toBe('');
    expect(sanitizeStringField(undefined)).toBe('');
    expect(sanitizeStringField(123)).toBe('');
  });
});

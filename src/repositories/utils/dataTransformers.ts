// src/repositories/utils/dataTransformers.tsx

import { Timestamp } from 'firebase/firestore';

/**
 * Repo-level utility to deeply convert Firestore documents to JS objects.
 * Ensures all timestamps are converted to JavaScript Date.
 */
export function firestoreDocumentToPlain<T>(doc: Record<string, unknown>): T {
  function convert(obj: unknown): unknown {
    if (obj instanceof Timestamp) {
      return obj.toDate();
    }
    if (Array.isArray(obj)) {
      return obj.map(convert);
    }
    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = convert(value);
      }
      return result;
    }
    return obj;
  }
  return convert(doc) as T;
}

/**
 * Repo-level utility to convert JS objects to Firestore-compatible documents.
 * Converts JS Date to Firestore Timestamp.
 */
export function plainToFirestoreDocument<T>(obj: T): Record<string, unknown> {
  function convert(val: unknown): unknown {
    if (val instanceof Date) {
      return Timestamp.fromDate(val);
    }
    if (Array.isArray(val)) {
      return val.map(convert);
    }
    if (val && typeof val === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(val)) {
        result[key] = convert(value);
      }
      return result;
    }
    return val;
  }
  return convert(obj) as Record<string, unknown>;
}

/**
 * Example: Repository-centric sanitizer
 */
export function sanitizeStringField(val: unknown): string {
  return typeof val === 'string' ? val.trim() : '';
}

/**
 * Add more repo-specific data transformation and validation helpers here.
 */

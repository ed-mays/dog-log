// src/repositories/config.ts

/**
 * Centralized repository configuration and constants.
 * Follows project guidance to keep config separate from services and colocated with repositories.
 */

// Collection name constants (used across repositories)
export const COLLECTIONS = {
  PETS: 'pets',
  USERS: 'users',
  VET_VISITS: 'vetVisits',
  // Add additional collections as needed
};

// Environment-specific repo config
export const REPOSITORY_ENV = {
  useEmulator: import.meta.env.MODE === 'development',
  emulatorHost: import.meta.env.VITE_FIREBASE_EMULATOR_HOST ?? 'localhost',
};

// Common query operators for repositories (Firestore)
export const FIRESTORE_OPERATORS = {
  EQ: '==',
  NEQ: '!=',
  GT: '>',
  GTE: '>=',
  LT: '<',
  LTE: '<=',
  IN: 'in',
  ARRAY_CONTAINS: 'array-contains',
} as const;

// Example: Centralized field validation for repositories
export function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

// Example: Query builder utility, e.g. for pet active/archived status
export function buildIsArchivedFilter(isArchived: boolean) {
  return {
    field: 'isArchived',
    operator: FIRESTORE_OPERATORS.EQ,
    value: isArchived,
  };
}

/**
 * Add repository-centric config, constants, and utilities here.
 * Services should import these via repository module boundaries, not directly.
 */

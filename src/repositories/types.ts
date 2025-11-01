// Base entity interface that all domain entities extend
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Archive support for soft deletes
export interface ArchivableEntity extends BaseEntity {
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: string;
}

// Generic repository interface for CRUD operations
export interface Repository<T extends BaseEntity> {
  getById(id: string): Promise<T | null>;
  getList(options?: QueryOptions): Promise<T[]>;
  create(entity: Omit<T, keyof BaseEntity>): Promise<T>;
  update(id: string, updates: Partial<Omit<T, keyof BaseEntity>>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Enhanced repository interface for entities that support archiving
export interface ArchivableRepository<T extends ArchivableEntity>
  extends Repository<T> {
  archive(id: string): Promise<T>;
  getActiveList(options?: QueryOptions): Promise<T[]>;
  getArchivedList(options?: QueryOptions): Promise<T[]>;
}

// Basic query options for simple filtering and pagination
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// Generic filter interface for search operations
export interface FilterCriteria {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

// Sort criteria for ordered results
export interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

// Advanced query options with structured filtering and sorting
// Uses Omit to exclude the conflicting filters property from QueryOptions
export interface AdvancedQueryOptions extends Omit<QueryOptions, 'filters'> {
  filters?: FilterCriteria[];
  sort?: SortCriteria[];
  searchTerm?: string;
}

// Response wrapper for operations that may fail
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

// Standardized error structure
export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Common error codes used across the service layer
export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FIRESTORE_ERROR: 'FIRESTORE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Pagination support for list operations
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasNext: boolean;
  nextCursor?: string;
}

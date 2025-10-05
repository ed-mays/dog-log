import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type { DocumentData, WhereFilterOp } from 'firebase/firestore';
import { db } from '@/firebase';
import { ErrorCodes } from '@repositories/types';
import type {
  BaseEntity,
  ArchivableEntity,
  Repository,
  ArchivableRepository,
  QueryOptions,
  ServiceError,
  AdvancedQueryOptions,
  FilterCriteria,
} from '@repositories/types';

/**
 * Abstract base repository that provides common Firestore operations
 * All feature-specific repositories should extend this class
 */
export abstract class BaseRepository<T extends BaseEntity>
  implements Repository<T>
{
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Convert Firestore document to plain JavaScript object
   * This ensures no Firestore types leak into the application layer
   */
  protected documentToEntity(doc: QueryDocumentSnapshot<DocumentData>): T {
    const data = doc.data();

    // This nested function recursively processes the data
    const convertTimestamps = (obj: DocumentData): DocumentData => {
      // Return non-objects or null values as is
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      // Handle arrays by mapping over them and calling recursively
      if (Array.isArray(obj)) {
        return obj.map((item) => convertTimestamps(item));
      }

      const converted: DocumentData = {};
      for (const [key, value] of Object.entries(obj)) {
        // **THE FIX IS HERE:**
        // Instead of `instanceof Timestamp`, we check for any object
        // that has a `toDate` method. This works for both the real
        // Timestamp and our test mock.
        if (value && typeof value.toDate === 'function') {
          converted[key] = value.toDate();
        } else if (value && typeof value === 'object') {
          // Recurse for nested objects
          converted[key] = convertTimestamps(value);
        } else {
          // Keep primitive values as they are
          converted[key] = value;
        }
      }
      return converted;
    };

    return {
      id: doc.id,
      ...convertTimestamps(data),
    } as T;
  }

  /**
   * Convert entity data for Firestore storage
   * Converts Dates to Timestamps and removes the id field
   */
  protected entityToDocument(entity: Record<string, unknown>): DocumentData {
    const { id, ...data } = entity;

    const convertDates = (obj: Record<string, unknown>): DocumentData => {
      const converted: DocumentData = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value instanceof Date) {
          converted[key] = Timestamp.fromDate(value);
        } else if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          converted[key] = convertDates(value as Record<string, unknown>);
        } else {
          converted[key] = value;
        }
      }
      return converted;
    };

    return convertDates(data);
  }

  /**
   * Handle errors and convert them to standardized ServiceError format
   */
  protected handleError(error: unknown, context: string): ServiceError {
    console.error(`Error in ${context}:`, error);

    if (error instanceof Error) {
      // Map common Firestore errors to our error codes
      if (error.message.includes('permission-denied')) {
        return {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Access denied to this resource',
          details: { context, originalError: error.message },
        };
      }

      if (error.message.includes('not-found')) {
        return {
          code: ErrorCodes.NOT_FOUND,
          message: 'Resource not found',
          details: { context, originalError: error.message },
        };
      }

      return {
        code: ErrorCodes.FIRESTORE_ERROR,
        message: error.message,
        details: { context },
      };
    }

    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: 'An unexpected error occurred',
      details: { context },
    };
  }

  /**
   * Get a single entity by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, 'users', id, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.documentToEntity(
        docSnap as QueryDocumentSnapshot<DocumentData>
      );
    } catch (error) {
      throw this.handleError(error, `getById(${id})`);
    }
  }

  /**
   * Get a list of entities with optional query options
   */
  async getList(userId: string, options: QueryOptions = {}): Promise<T[]> {
    try {
      const collectionRef = collection(
        db,
        'users',
        userId,
        this.collectionName
      );
      let q = query(collectionRef);

      // Apply ordering
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.orderDirection || 'asc'));
      }

      // Apply limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => this.documentToEntity(doc));
    } catch (error) {
      throw this.handleError(error, 'getList');
    }
  }

  /**
   * Create a new entity
   */
  async create(
    userId: string,
    entityData: Omit<T, keyof BaseEntity>
  ): Promise<T> {
    try {
      const now = new Date();

      const newEntity = {
        ...entityData,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      } as Record<string, unknown>;

      const docData = this.entityToDocument(newEntity);
      const docRef = await addDoc(
        collection(db, 'users', userId, this.collectionName),
        docData
      );

      // Return the created entity with the generated ID
      return {
        id: docRef.id,
        ...newEntity,
      } as T;
    } catch (error) {
      throw this.handleError(error, 'create');
    }
  }

  /**
   * Update an existing entity
   */
  async update(
    userId: string,
    id: string,
    updates: Partial<Omit<T, keyof BaseEntity>>
  ): Promise<T> {
    try {
      const docRef = doc(db, 'users', userId, this.collectionName, id);

      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      } as Record<string, unknown>;

      const docData = this.entityToDocument(updateData);
      await updateDoc(docRef, docData);

      // Return the updated entity
      const updatedDoc = await getDoc(docRef);
      return this.documentToEntity(
        updatedDoc as QueryDocumentSnapshot<DocumentData>
      );
    } catch (error) {
      throw this.handleError(error, `update(${id})`);
    }
  }

  /**
   * Delete an entity (hard delete)
   */
  async delete(userId: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw this.handleError(error, `delete(${id})`);
    }
  }

  /**
   * Build advanced queries with filtering and sorting
   */
  protected buildAdvancedQuery(userId: string, options: AdvancedQueryOptions) {
    const collectionRef = collection(db, 'users', userId, this.collectionName);
    let q = query(collectionRef);

    // Apply filters
    if (options.filters) {
      for (const filter of options.filters) {
        q = query(
          q,
          where(filter.field, this.mapOperator(filter.operator), filter.value)
        );
      }
    }

    // Apply sorting
    if (options.sort) {
      for (const sort of options.sort) {
        q = query(q, orderBy(sort.field, sort.direction));
      }
    }

    // Apply limit
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    return q;
  }

  /**
   * Map our filter operators to Firestore operators
   */
  private mapOperator(operator: FilterCriteria['operator']): WhereFilterOp {
    const operatorMap: Record<FilterCriteria['operator'], WhereFilterOp> = {
      eq: '==',
      neq: '!=',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      in: 'in',
      contains: 'array-contains',
    };

    return operatorMap[operator];
  }
}

/**
 * Extended base repository for entities that support archiving (soft delete)
 */
export abstract class ArchivableBaseRepository<T extends ArchivableEntity>
  extends BaseRepository<T>
  implements ArchivableRepository<T>
{
  /**
   * Archive an entity (soft delete)
   */
  async archive(userId: string, id: string): Promise<T> {
    const now = new Date();

    return this.update(userId, id, {
      isArchived: true,
      archivedAt: now,
      archivedBy: userId,
    } as Partial<Omit<T, keyof BaseEntity>>);
  }

  /**
   * Get only active (non-archived) entities
   */
  async getActiveList(
    userId: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    try {
      const collectionRef = collection(
        db,
        'users',
        userId,
        this.collectionName
      );
      let q = query(collectionRef, where('isArchived', '==', false));

      // Apply ordering
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.orderDirection || 'asc'));
      }

      // Apply limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => this.documentToEntity(doc));
    } catch (error) {
      throw this.handleError(error, 'getActiveList');
    }
  }

  /**
   * Get only archived entities
   */
  async getArchivedList(
    userId: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    try {
      const collectionRef = collection(
        db,
        'users',
        userId,
        this.collectionName
      );
      let q = query(collectionRef, where('isArchived', '==', true));

      // Apply ordering
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.orderDirection || 'asc'));
      }

      // Apply limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => this.documentToEntity(doc));
    } catch (error) {
      throw this.handleError(error, 'getArchivedList');
    }
  }

  /**
   * Override getList to return only active entities by default
   */
  async getList(userId: string, options: QueryOptions = {}): Promise<T[]> {
    return this.getActiveList(userId, options);
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseRepository, ArchivableBaseRepository } from './BaseRepository';
import {
  BaseEntity,
  ArchivableEntity,
  AdvancedQueryOptions,
  ServiceError,
} from '@repositories/types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    constructor(
      public seconds: number,
      public nanoseconds: number
    ) {}
    toDate() {
      return new Date(this.seconds * 1000);
    }
    static fromDate(date: Date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
  }
  return {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: MockTimestamp,
  };
});

vi.mock('@firebase', () => ({ db: {} }));

interface TestEntity extends BaseEntity {
  name: string;
  description: string;
  metadata?: { lastVisit?: Date };
}
interface TestArchivableEntity extends ArchivableEntity {
  name: string;
  description: string;
}

class TestRepository extends BaseRepository<TestEntity> {
  constructor() {
    super('test-collection');
  }
}
class TestArchivableRepository extends ArchivableBaseRepository<TestArchivableEntity> {
  constructor() {
    super('test-archivable-collection');
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
    vi.clearAllMocks();
  });

  describe('documentToEntity', () => {
    it('should convert Firestore document to plain entity', () => {
      // Use object literal for timestamps
      const mockDoc = {
        id: 'test-id',
        data: () => ({
          // Correctly assign the function to the 'data' property
          name: 'Test Pet',
          description: 'A test description', // Added to match the TestEntity interface
          createdAt: { toDate: () => new Date('2023-01-01T00:00:00Z') },
          updatedAt: { toDate: () => new Date('2023-01-02T00:00:00Z') },
        }),
      };
      const entity = repository['documentToEntity'](mockDoc as never);
      expect(entity.id).toBe('test-id');
      expect(entity.name).toBe('Test Pet');
      expect(entity.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(entity.updatedAt).toEqual(new Date('2023-01-02T00:00:00Z'));
    });

    it('should handle nested timestamp conversion', () => {
      const mockDoc = {
        id: 'test-id',
        data: () => ({
          name: 'Test Pet',
          description: 'A test description',
          metadata: {
            lastVisit: { toDate: () => new Date('2023-01-01T00:00:00Z') },
          },
        }),
      };
      const entity = repository['documentToEntity'](mockDoc as never);
      // Add your assertions here
      expect(entity.metadata?.lastVisit).toEqual(
        new Date('2023-01-01T00:00:00Z')
      );
    });
  });

  describe('entityToDocument', () => {
    it('should convert entity to Firestore document format', () => {
      const entity = {
        id: 'test-id',
        name: 'Test Pet',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      };
      const docData = repository['entityToDocument'](entity);
      expect(docData.name).toBe('Test Pet');
      expect(typeof docData.createdAt?.toDate).toBe('function');
      expect(typeof docData.updatedAt?.toDate).toBe('function');
      expect(docData.id).toBeUndefined();
      expect(docData.createdAt.toDate()).toEqual(
        new Date('2023-01-01T00:00:00Z')
      );
      expect(docData.updatedAt.toDate()).toEqual(
        new Date('2023-01-02T00:00:00Z')
      );
    });

    it('should handle nested date conversion', () => {
      const entity: Partial<TestEntity> = {
        // Using Partial since id, createdAt etc. are omitted
        name: 'Test Pet',
        description: 'A test description',
        metadata: { lastVisit: new Date('2023-01-01T00:00:00Z') }, // Correct property and object syntax
      };
      const docData = repository['entityToDocument'](entity);
      expect(typeof docData.metadata.lastVisit?.toDate).toBe('function');
      expect(docData.metadata.lastVisit.toDate()).toEqual(
        new Date('2023-01-01T00:00:00Z')
      );
    });
  });

  describe('handleError', () => {
    it('should map permission-denied errors correctly', () => {
      const error = new Error('permission-denied: Access denied');
      const serviceError = repository['handleError'](error, 'test context');
      expect(serviceError.code).toBe('UNAUTHORIZED');
      expect(serviceError.message).toBe('Access denied to this resource');
    });

    it('should map not-found errors correctly', () => {
      const error = new Error('not-found: Document not found');
      const serviceError = repository['handleError'](error, 'test context');
      expect(serviceError.code).toBe('NOT_FOUND');
      expect(serviceError.message).toBe('Resource not found');
    });

    it('should handle unknown errors', () => {
      const error = 'Unknown error';
      const serviceError = repository['handleError'](error, 'test context');
      expect(serviceError.code).toBe('UNKNOWN_ERROR');
      expect(serviceError.message).toBe('An unexpected error occurred');
    });
  });
});

describe('ArchivableBaseRepository', () => {
  let repository: TestArchivableRepository;
  beforeEach(() => {
    repository = new TestArchivableRepository();
    vi.clearAllMocks();
  });

  describe('archive', () => {
    it('should call update with archive fields', async () => {
      const updateSpy = vi.spyOn(repository, 'update').mockResolvedValue({
        id: 'test-id',
        name: 'Test Pet',
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-id',
        description: 'description',
      });
      await repository.archive('test-id');
      expect(updateSpy).toHaveBeenCalledWith('test-id', {
        isArchived: true,
        archivedAt: expect.any(Date),
      });
    });
  });
});

// Additional coverage for CRUD methods and query builder
import {
  collection,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';

describe('BaseRepository CRUD and queries', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
    vi.clearAllMocks();
  });

  it('getById returns mapped entity when document exists', async () => {
    // Arrange: mock doc() and getDoc()
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      id: 'abc123',
      data: () => ({
        name: 'X',
        description: 'Y',
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00Z')),
      }),
    } as unknown as import('firebase/firestore').QueryDocumentSnapshot);

    // eslint-disable-next-line testing-library/no-await-sync-queries
    const entity = await repository.getById('abc123');

    expect(entity).not.toBeNull();
    expect(entity?.id).toBe('abc123');
    expect(entity?.name).toBe('X');
    expect(entity?.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('getById returns null when document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as unknown as import('firebase/firestore').QueryDocumentSnapshot);

    // eslint-disable-next-line testing-library/no-await-sync-queries
    const entity = await repository.getById('missing');
    expect(entity).toBeNull();
  });

  it('getList applies orderBy and limit and maps results', async () => {
    // Arrange list results
    const docA = {
      id: 'a',
      data: () => ({
        name: 'A',
        description: 'desc',
        createdAt: Timestamp.fromDate(new Date('2024-02-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-02-02T00:00:00Z')),
      }),
    } as unknown as import('firebase/firestore').QueryDocumentSnapshot;
    const docB = {
      id: 'b',
      data: () => ({
        name: 'B',
        description: 'desc',
        createdAt: Timestamp.fromDate(new Date('2024-03-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-03-02T00:00:00Z')),
      }),
    } as unknown as import('firebase/firestore').QueryDocumentSnapshot;
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [docA, docB] } as never);

    const items = await repository.getList({ orderBy: 'name', limit: 2 });

    expect(orderBy).toHaveBeenCalledWith('name', 'asc');
    expect(limit).toHaveBeenCalledWith(2);
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(items[0].createdAt).toEqual(new Date('2024-02-01T00:00:00Z'));
  });

  it('create writes to collection and returns entity with id and dates', async () => {
    vi.mocked(addDoc).mockResolvedValueOnce({ id: 'new-1' } as never);

    const result = await repository.create({
      name: 'Created',
      description: 'New desc',
    } as Omit<TestEntity, keyof BaseEntity>);

    expect(addDoc).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('new-1');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('update updates existing document and returns the mapped entity', async () => {
    // First getDoc() says it exists
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => true } as never);
    // updateDoc resolves
    vi.mocked(updateDoc).mockResolvedValueOnce(undefined as never);
    // Second getDoc() returns updated snapshot
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      id: 'u1',
      data: () => ({
        name: 'Updated',
        description: 'desc',
        updatedAt: Timestamp.fromDate(new Date('2024-04-02T00:00:00Z')),
        createdAt: Timestamp.fromDate(new Date('2024-04-01T00:00:00Z')),
      }),
    } as unknown as import('firebase/firestore').QueryDocumentSnapshot);

    const entity = await repository.update('u1', { name: 'Updated' });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(entity.id).toBe('u1');
    expect(entity.name).toBe('Updated');
  });

  it('delete delegates to deleteDoc', async () => {
    vi.mocked(deleteDoc).mockResolvedValueOnce(undefined as never);
    await repository.delete('gone');
    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });
});

describe('BaseRepository buildAdvancedQuery', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
    vi.clearAllMocks();
  });

  it('maps filter operators, sort, and limit into Firestore query calls', () => {
    // Ensure our mocked `query` function returns a non-undefined value for chaining
    vi.mocked(query).mockReturnValue({} as never);
    const q = repository['buildAdvancedQuery']('user-1', {
      filters: [
        { field: 'name', operator: 'eq', value: 'A' },
        { field: 'age', operator: 'gt', value: 1 },
        { field: 'tags', operator: 'contains', value: 'x' },
      ],
      sort: [
        { field: 'createdAt', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ],
      limit: 10,
    });

    // Ensure builder returns something (opaque in our mock), and where/orderBy/limit were invoked
    expect(query).toHaveBeenCalled();
    expect(where).toHaveBeenCalledTimes(3);
    expect(orderBy).toHaveBeenCalledTimes(2);
    expect(limit).toHaveBeenCalledWith(10);
    expect(q).toBeDefined();
  });
});

// Additional branch coverage added by tests below

describe('BaseRepository additional branches', () => {
  it('update maps missing document to FIRESTORE_ERROR', async () => {
    const repository = new TestRepository();
    // First getDoc() -> not exists triggers throw in update
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as never);

    await expect(
      repository.update('missing', { name: 'X' } as Partial<
        Omit<TestEntity, keyof BaseEntity>
      >)
    ).rejects.toMatchObject({
      code: 'FIRESTORE_ERROR',
    });
  });

  it('getList error path maps to FIRESTORE_ERROR', async () => {
    const repository = new TestRepository();
    vi.mocked(getDocs).mockRejectedValueOnce(new Error('random failure'));
    await expect(repository.getList()).rejects.toMatchObject({
      code: 'FIRESTORE_ERROR',
      message: 'random failure',
    });
  });
});

describe('BaseRepository buildAdvancedQuery operators', () => {
  let repository: TestRepository;
  beforeEach(() => {
    repository = new TestRepository();
    vi.clearAllMocks();
  });

  it('applies filters with mapped operators, sorting and limit', () => {
    // Call the protected method via indexer
    (
      repository as unknown as {
        buildAdvancedQuery: (
          userId: string,
          options: AdvancedQueryOptions
        ) => unknown;
      }
    ).buildAdvancedQuery('user-1', {
      filters: [
        { field: 'age', operator: 'gt', value: 5 },
        { field: 'tags', operator: 'contains', value: 'friendly' },
      ],
      sort: [{ field: 'name', direction: 'desc' }],
      limit: 10,
    });

    expect(where).toHaveBeenNthCalledWith(1, 'age', '>', 5);
    expect(where).toHaveBeenNthCalledWith(
      2,
      'tags',
      'array-contains',
      'friendly'
    );
    expect(orderBy).toHaveBeenCalledWith('name', 'desc');
    expect(limit).toHaveBeenCalledWith(10);
  });
});

describe('buildAdvancedQuery no-options and collection args', () => {
  it('uses collection(db, userId, collectionName) and applies no extras when options empty', () => {
    const repository = new TestRepository();
    vi.clearAllMocks();
    // make query return something
    vi.mocked(query).mockReturnValue({} as never);

    // Call with empty options
    (
      repository as unknown as {
        buildAdvancedQuery: (
          userId: string,
          options: AdvancedQueryOptions
        ) => unknown;
      }
    ).buildAdvancedQuery('user-42', {});

    // where/orderBy/limit should not be called
    expect(where).not.toHaveBeenCalled();
    expect(orderBy).not.toHaveBeenCalled();
    expect(limit).not.toHaveBeenCalled();

    // collection should be called with (db, userId, collectionName)
    expect(collection).toHaveBeenCalledWith(
      expect.anything(),
      'user-42',
      'test-collection'
    );
  });
});

describe('mapOperator full matrix', () => {
  it('maps neq, gte, lt, lte, in operators', () => {
    const repository = new TestRepository();
    vi.mocked(query).mockReturnValue({} as never);
    (
      repository as unknown as {
        buildAdvancedQuery: (
          userId: string,
          options: AdvancedQueryOptions
        ) => unknown;
      }
    ).buildAdvancedQuery('u', {
      filters: [
        { field: 'status', operator: 'neq', value: 'x' },
        { field: 'score', operator: 'gte', value: 10 },
        { field: 'age', operator: 'lt', value: 5 },
        { field: 'height', operator: 'lte', value: 100 },
        { field: 'tag', operator: 'in', value: ['a', 'b'] },
      ],
    });

    expect(where).toHaveBeenNthCalledWith(1, 'status', '!=', 'x');
    expect(where).toHaveBeenNthCalledWith(2, 'score', '>=', 10);
    expect(where).toHaveBeenNthCalledWith(3, 'age', '<', 5);
    expect(where).toHaveBeenNthCalledWith(4, 'height', '<=', 100);
    expect(where).toHaveBeenNthCalledWith(5, 'tag', 'in', ['a', 'b']);
  });
});

describe('error mapping for getById/create/delete', () => {
  it('getById rejection maps to FIRESTORE_ERROR with context', async () => {
    const repository = new TestRepository();
    vi.mocked(getDoc).mockRejectedValueOnce(new Error('kaboom'));
    await expect(repository.getById('z')).rejects.toMatchObject({
      code: 'FIRESTORE_ERROR',
      message: 'kaboom',
      details: expect.objectContaining({
        context: expect.stringContaining('getById('),
      }),
    });
  });

  it('create rejection maps to FIRESTORE_ERROR with context', async () => {
    const repository = new TestRepository();
    vi.mocked(addDoc).mockRejectedValueOnce(new Error('nope'));
    await expect(
      repository.create({ name: 'X', description: 'd' } as unknown as Omit<
        TestEntity,
        keyof BaseEntity
      >)
    ).rejects.toMatchObject({
      code: 'FIRESTORE_ERROR',
      message: 'nope',
      details: expect.objectContaining({ context: 'create' }),
    });
  });

  it('delete rejection maps to FIRESTORE_ERROR with context', async () => {
    const repository = new TestRepository();
    vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('denied'));
    await expect(repository.delete('bad')).rejects.toMatchObject({
      code: 'FIRESTORE_ERROR',
      message: 'denied',
      details: expect.objectContaining({
        context: expect.stringContaining('delete('),
      }),
    });
  });
});

describe('documentToEntity array timestamp conversion', () => {
  it('converts timestamps nested inside arrays', () => {
    const repository = new TestRepository();
    const mockDoc = {
      id: 'id1',
      data: () => ({
        name: 'N',
        description: 'D',
        visits: [
          { at: { toDate: () => new Date('2024-01-01T00:00:00Z') } },
          { at: { toDate: () => new Date('2024-02-02T00:00:00Z') } },
        ],
      }),
    } as unknown as import('firebase/firestore').QueryDocumentSnapshot;

    const entity = (
      repository as unknown as {
        documentToEntity: (
          doc: QueryDocumentSnapshot<DocumentData>
        ) => TestEntity;
      }
    ).documentToEntity(
      mockDoc as unknown as QueryDocumentSnapshot<DocumentData>
    );
    expect(Array.isArray(entity.visits)).toBe(true);
    expect(entity.visits[0].at).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(entity.visits[1].at).toEqual(new Date('2024-02-02T00:00:00Z'));
  });
});

describe('handleError additional mapping', () => {
  it('maps generic Error to FIRESTORE_ERROR with original message', () => {
    const repository = new TestRepository();
    const err = new Error('boom');
    const mapped = (
      repository as unknown as {
        handleError: (err: unknown, ctx: string) => ServiceError;
      }
    ).handleError(err, 'ctx');
    expect(mapped.code).toBe('FIRESTORE_ERROR');
    expect(mapped.message).toBe('boom');
  });
});

// ArchivableBaseRepository additional coverage for lists
describe('ArchivableBaseRepository lists', () => {
  let repo: TestArchivableRepository;
  beforeEach(() => {
    repo = new TestArchivableRepository();
    vi.clearAllMocks();
  });

  it('getActiveList returns mapped entities and applies orderBy/limit when provided', async () => {
    const docA = {
      id: 'a',
      data: () => ({
        name: 'A',
        description: 'd',
        isArchived: false,
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00Z')),
      }),
    } as unknown as import('firebase/firestore').QueryDocumentSnapshot;

    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [docA] } as never);

    const items = await repo.getActiveList({ orderBy: 'name', limit: 1 });

    expect(where).toHaveBeenCalledWith('isArchived', '==', false);
    expect(orderBy).toHaveBeenCalledWith('name', 'asc');
    expect(limit).toHaveBeenCalledWith(1);
    expect(items[0].id).toBe('a');
    expect(items[0].createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
  });

  it('getActiveList error path maps to FIRESTORE_ERROR', async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error('active-fail'));
    await expect(repo.getActiveList()).rejects.toMatchObject({
      code: 'FIRESTORE_ERROR',
      message: 'active-fail',
      details: expect.objectContaining({ context: 'getActiveList' }),
    });
  });

  it('getArchivedList returns mapped entities and applies orderBy/limit when provided', async () => {
    const docB = {
      id: 'b',
      data: () => ({
        name: 'B',
        description: 'd',
        isArchived: true,
        createdAt: Timestamp.fromDate(new Date('2024-02-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-02-02T00:00:00Z')),
      }),
    } as unknown as import('firebase/firestore').QueryDocumentSnapshot;

    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [docB] } as never);

    const items = await repo.getArchivedList({ orderBy: 'name', limit: 2 });

    expect(where).toHaveBeenCalledWith('isArchived', '==', true);
    expect(orderBy).toHaveBeenCalledWith('name', 'asc');
    expect(limit).toHaveBeenCalledWith(2);
    expect(items[0].id).toBe('b');
    expect(items[0].createdAt).toEqual(new Date('2024-02-01T00:00:00Z'));
  });

  it('getArchivedList error path maps to FIRESTORE_ERROR', async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error('archived-fail'));
    await expect(repo.getArchivedList()).rejects.toMatchObject({
      code: 'FIRESTORE_ERROR',
      message: 'archived-fail',
      details: expect.objectContaining({ context: 'getArchivedList' }),
    });
  });

  it('getList delegates to getActiveList', async () => {
    const spy = vi.spyOn(repo, 'getActiveList').mockResolvedValueOnce([]);
    const opts = { orderBy: 'createdAt' as const };
    const res = await repo.getList(opts);
    expect(spy).toHaveBeenCalledWith(opts);
    expect(res).toEqual([]);
  });
});

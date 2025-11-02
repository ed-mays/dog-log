import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseRepository, ArchivableBaseRepository } from './BaseRepository';
import { BaseEntity, ArchivableEntity } from '@repositories/types';

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

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/firestore used by BaseRepository and our repository
const getDocsMock = vi.fn();
const runTransactionMock = vi.fn();
const updateDocMock = vi.fn();

vi.mock('firebase/firestore', () => {
  const Timestamp = { fromDate: (d: Date) => ({ toDate: () => d }) };
  return {
    Timestamp,
    collection: (...args: any[]) => ({ __type: 'collection', args }),
    doc: (_col: any, id?: string) => ({ __type: 'doc', id: id ?? 'gen-id' }),
    getDoc: vi
      .fn()
      .mockResolvedValue({ exists: () => true, id: 'doc1', data: () => ({}) }),
    getDocs: (...args: any[]) => getDocsMock(...args),
    addDoc: vi.fn().mockResolvedValue({ id: 'new-id' }),
    setDoc: vi.fn(),
    updateDoc: (...args: any[]) => updateDocMock(...args),
    deleteDoc: vi.fn(),
    query: (...args: any[]) => ({ __type: 'query', args }),
    where: (...args: any[]) => ({ __type: 'where', args }),
    orderBy: (...args: any[]) => ({ __type: 'orderBy', args }),
    limit: (...args: any[]) => ({ __type: 'limit', args }),
    runTransaction: (...args: any[]) => runTransactionMock(...args),
  };
});

vi.mock('../firebase', () => ({ db: {} }));

import { PetVetRepository } from './petVetRepository';

describe('PetVetRepository', () => {
  const userId = 'user-1';
  let repo: PetVetRepository;

  beforeEach(() => {
    repo = new PetVetRepository(userId);
    getDocsMock.mockReset();
    runTransactionMock.mockReset();
    updateDocMock.mockReset();
  });

  it('listLinksByPet queries by petId and maps docs', async () => {
    // Arrange getDocs to return two docs
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'l1',
          data: () => ({
            petId: 'p1',
            vetId: 'v1',
            role: 'primary',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'l2',
          data: () => ({
            petId: 'p1',
            vetId: 'v2',
            role: 'other',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ],
    });

    const result = await repo.listLinksByPet('p1');
    expect(result.map((r) => r.id)).toEqual(['l1', 'l2']);
  });

  it('upsertLink updates when id present', async () => {
    const spy = vi
      .spyOn(PetVetRepository.prototype as any, 'update')
      .mockResolvedValue({ id: 'l1' } as any);
    await repo.upsertLink({
      id: 'l1',
      petId: 'p1',
      vetId: 'v1',
      role: 'other',
      createdBy: userId,
    } as any);
    expect(spy).toHaveBeenCalled();
  });

  it('upsertLink creates when id is missing', async () => {
    const spy = vi
      .spyOn(PetVetRepository.prototype as any, 'create')
      .mockResolvedValue({ id: 'l2' } as any);
    await repo.upsertLink({
      petId: 'p1',
      vetId: 'v1',
      role: 'other',
      createdBy: userId,
    } as any);
    expect(spy).toHaveBeenCalled();
  });

  it('setPrimaryForPet promotes new and demotes existing primary', async () => {
    // First call to runTransaction invokes our callback with a trx object
    runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
      const trx = {
        get: async (_ref: any) => ({
          exists: () => true,
          id: 'newPrimary',
          data: () => ({
            petId: 'p1',
            vetId: 'v2',
            role: 'specialist',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      // getDocs call inside the transaction will use our global getDocsMock; set it to return current primary
      getDocsMock.mockResolvedValueOnce({
        docs: [
          {
            id: 'curr',
            data: () => ({
              petId: 'p1',
              vetId: 'v1',
              role: 'primary',
              previousNonPrimaryRole: 'emergency',
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
            }),
          },
        ],
      });
      await cb(trx);
    });

    await repo.setPrimaryForPet('p1', 'l-new');

    // Ensure transaction was invoked
    expect(runTransactionMock).toHaveBeenCalled();
  });

  it('listLinksByVet queries by vetId and maps docs', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'l3',
          data: () => ({
            petId: 'p9',
            vetId: 'v1',
            role: 'other',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ],
    });
    const result = await repo.listLinksByVet('v1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('l3');
  });

  it('setPrimaryForPet when there is no current primary (no demotion path)', async () => {
    runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
      const trx = {
        get: async (_ref: any) => ({
          exists: () => true,
          id: 'newPrimary',
          data: () => ({
            petId: 'p1',
            vetId: 'v2',
            role: 'other',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      // Return empty docs to simulate no current primary
      getDocsMock.mockResolvedValueOnce({ docs: [] });
      await cb(trx);
    });

    await repo.setPrimaryForPet('p1', 'link-new');
    expect(runTransactionMock).toHaveBeenCalled();
  });

  it('setPrimaryForPet throws when new primary link is missing', async () => {
    runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
      const trx = {
        get: async (_ref: any) => ({ exists: () => false }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      await cb(trx);
    });

    await expect(repo.setPrimaryForPet('p1', 'missing-id')).rejects.toThrow(
      'New primary link not found'
    );
  });

  it("setPrimaryForPet demotes old primary to 'other' when previousNonPrimaryRole missing", async () => {
    runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
      const trx = {
        get: async (_ref: any) => ({
          exists: () => true,
          id: 'newPrimary',
          data: () => ({
            petId: 'p1',
            vetId: 'v2',
            role: 'other',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      // Current primary exists but without previousNonPrimaryRole
      getDocsMock.mockResolvedValueOnce({
        docs: [
          {
            id: 'curr',
            data: () => ({
              petId: 'p1',
              vetId: 'v1',
              role: 'primary',
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
            }),
          },
        ],
      });
      await cb(trx);
      expect(trx.update).toHaveBeenCalledTimes(2);
    });

    await repo.setPrimaryForPet('p1', 'link-new');
    expect(runTransactionMock).toHaveBeenCalled();
  });

  // Verify delegations for deleteLink and getLinkById (consolidated from extras)
  it('deleteLink delegates to base delete', async () => {
    const spy = vi
      .spyOn(PetVetRepository.prototype as any, 'delete')
      .mockResolvedValue(undefined);
    await repo.deleteLink('l1');
    expect(spy).toHaveBeenCalledWith('l1');
  });

  it('getLinkById delegates to base getById', async () => {
    const expected = { id: 'l2' } as any;
    const spy = vi
      .spyOn(PetVetRepository.prototype as any, 'getById')
      .mockResolvedValue(expected);
    const res = await repo.getLinkById('l2');
    expect(spy).toHaveBeenCalledWith('l2');
    expect(res).toBe(expected);
  });
});

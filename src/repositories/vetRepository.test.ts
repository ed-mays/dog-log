/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VetRepository, DuplicateVetError } from './vetRepository';
import type { Vet } from '@models/vets';

// Mocks for Firestore used by VetRepository
const runTransactionMock = vi.fn();
const getDocMock = vi.fn();

vi.mock('firebase/firestore', () => {
  const Timestamp = { fromDate: (d: Date) => ({ toDate: () => d }) };
  return {
    Timestamp,
    collection: (...args: any[]) => ({ __type: 'collection', args }),
    doc: (_col: any, id?: string) => ({ __type: 'doc', id: id ?? 'gen-id' }),
    getDoc: (...args: any[]) => getDocMock(...args),
    setDoc: vi.fn(),
    addDoc: vi.fn().mockResolvedValue({ id: 'new-id' }),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    runTransaction: (...args: any[]) => runTransactionMock(...args),
  };
});

vi.mock('@firebase', () => ({ db: {} }));

describe('VetRepository', () => {
  const userId = 'user-1';
  let repo: VetRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new VetRepository(userId);
    getDocMock.mockReset();
    runTransactionMock.mockReset();
  });

  const baseVetInput: Omit<Vet, 'id' | 'createdAt' | 'updatedAt'> = {
    ownerUserId: userId,
    name: 'Dr. A',
    phone: '+15550000000',
    email: undefined,
    website: undefined,
    clinicName: undefined,
    address: undefined,
    specialties: undefined,
    notes: undefined,
    createdBy: userId,
    isArchived: false as any,
    _normName: 'dr. a',
    _e164Phone: '+15550000000',
  } as unknown as any;

  it('createVet writes lock and entity in transaction', async () => {
    // Simulate no existing key
    runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
      const trx = {
        get: async (_ref: any) => ({ exists: () => false }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      const result = await cb(trx);
      return result;
    });

    const created = await repo.createVet(baseVetInput);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Dr. A');
  });

  it('createVet throws DuplicateVetError when lock exists', async () => {
    runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
      const trx = {
        get: async (_ref: any) => ({ exists: () => true }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      return cb(trx);
    });

    await expect(repo.createVet(baseVetInput)).rejects.toBeInstanceOf(
      DuplicateVetError
    );
  });

  it('updateVet delegates to update when key does not change', async () => {
    // Mock getById on the instance to return a current vet
    const current: Vet = {
      id: 'v1',
      ownerUserId: userId,
      name: 'Dr. A',
      phone: '+15550000000',
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      createdBy: userId,
      _normName: 'dr. a',
      _e164Phone: '+15550000000',
    } as unknown as Vet;
    vi.spyOn(VetRepository.prototype as any, 'getById').mockResolvedValue(
      current
    );
    const updateSpy = vi
      .spyOn(VetRepository.prototype as any, 'update')
      .mockResolvedValue(current);

    const result = await repo.updateVet('v1', { website: 'https://a.example' });
    expect(updateSpy).toHaveBeenCalled();
    expect(result).toBe(current);
  });

  it('updateVet throws DuplicateVetError when new key collides', async () => {
    const current: Vet = {
      id: 'v1',
      ownerUserId: userId,
      name: 'Dr. A',
      phone: '+15550000000',
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      createdBy: userId,
      _normName: 'dr. a',
      _e164Phone: '+15550000000',
    } as unknown as Vet;
    vi.spyOn(VetRepository.prototype as any, 'getById').mockResolvedValue(
      current
    );

    runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
      // new key exists
      const trx = {
        get: async (_ref: any) => ({ exists: () => true }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      return cb(trx);
    });

    await expect(
      repo.updateVet('v1', { _normName: 'dr. b' } as any)
    ).rejects.toBeInstanceOf(DuplicateVetError);
  });
});

it('updateVet succeeds when key changes and new key is free', async () => {
  const userId = 'user-1';
  vi.spyOn(VetRepository.prototype as any, 'getById').mockResolvedValue({
    id: 'v1',
    ownerUserId: userId,
    name: 'Dr. A',
    phone: '+15550000000',
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
    createdBy: userId,
    _normName: 'dr. a',
    _e164Phone: '+15550000000',
  } as any);

  runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
    const trx = {
      get: async (_ref: any) => ({ exists: () => false }),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const res = await cb(trx);
    return res;
  });

  getDocMock.mockResolvedValue({
    exists: () => true,
    id: 'v1',
    data: () => ({
      ownerUserId: userId,
      name: 'Dr. B',
      phone: '+15556667777',
      createdBy: userId,
      _normName: 'dr. b',
      _e164Phone: '+15556667777',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  });

  const repo = new VetRepository(userId);
  const updated = await repo.updateVet('v1', {
    _normName: 'dr. b',
    _e164Phone: '+15556667777',
    name: 'Dr. B',
    phone: '+15556667777',
  } as any);
  expect(updated.id).toBe('v1');
  expect(updated._normName).toBe('dr. b');
});

it('updateVet throws when current vet not found', async () => {
  const userId = 'user-1';
  vi.spyOn(VetRepository.prototype as any, 'getById').mockResolvedValue(null);
  const repo = new VetRepository(userId);
  await expect(repo.updateVet('missing', { name: 'X' } as any)).rejects.toThrow(
    'Vet not found'
  );
});

// Additional branches and functions coverage
it('updateVet with only phone change updates via key-change path', async () => {
  const userId = 'user-1';
  vi.spyOn(VetRepository.prototype as any, 'getById').mockResolvedValue({
    id: 'v1',
    ownerUserId: userId,
    name: 'Dr. A',
    phone: '+15550000000',
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
    createdBy: userId,
    _normName: 'dr. a',
    _e164Phone: '+15550000000',
  } as any);

  runTransactionMock.mockImplementation(async (_db: any, cb: any) => {
    const trx = {
      get: async (_ref: any) => ({ exists: () => false }),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    return cb(trx);
  });

  getDocMock.mockResolvedValue({
    exists: () => true,
    id: 'v1',
    data: () => ({
      ownerUserId: userId,
      name: 'Dr. A',
      phone: '+15558889999',
      createdBy: userId,
      _normName: 'dr. a',
      _e164Phone: '+15558889999',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  });

  const repo = new VetRepository(userId);
  const updated = await repo.updateVet('v1', {
    _e164Phone: '+15558889999',
    phone: '+15558889999',
  } as any);
  expect(updated._e164Phone).toBe('+15558889999');
});

it('listVets delegates to getList', async () => {
  const userId = 'user-1';
  const repo = new VetRepository(userId);
  const expected = [{ id: 'v1' }, { id: 'v2' }] as any;
  const spy = vi
    .spyOn(VetRepository.prototype as any, 'getList')
    .mockResolvedValue(expected);
  const res = await repo.listVets();
  expect(spy).toHaveBeenCalled();
  expect(res).toBe(expected);
});

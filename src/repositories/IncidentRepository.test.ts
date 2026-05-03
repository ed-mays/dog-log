/* eslint-disable testing-library/no-await-sync-queries -- repository method named getById is not an RTL query */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { IncidentRepository } from './IncidentRepository';
import { db } from '@app-firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import type { IncidentCreateInput } from '@features/incidents/types';

// Mock Firebase per established repo-test pattern (see PetMedicationRepository.test.ts).
// Verify line for T-06 was amended in round 25 to use vi.mock instead of the emulator.
vi.mock('@app-firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
    }),
  },
}));

describe('IncidentRepository', () => {
  const userId = 'user-1';
  let repository: IncidentRepository;

  beforeEach(() => {
    repository = new IncidentRepository(userId);
    vi.clearAllMocks();
  });

  it('targets the top-level user-scoped collection per design §D3', () => {
    expect(repository.collectionPath).toBe(`users/${userId}/incidents`);
  });

  describe('create', () => {
    it('creates an incident at users/{userId}/incidents and returns the new entity', async () => {
      const startedAt = new Date('2026-05-02T10:00:00.000Z');
      const input: IncidentCreateInput = {
        petId: 'pet-1',
        startedAt,
      };

      (addDoc as Mock).mockResolvedValue({ id: 'new-incident-id' });

      const result = await repository.createIncident({
        ...input,
        userId,
        createdBy: userId,
      });

      expect(collection).toHaveBeenCalledWith(db, `users/${userId}/incidents`);
      expect(addDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'new-incident-id',
        petId: 'pet-1',
        userId,
        createdBy: userId,
        startedAt,
      });
    });
  });

  describe('createIncidentWithId', () => {
    it('writes via setDoc at the explicit id and returns a fully-formed Incident', async () => {
      const startedAt = new Date('2026-05-02T10:00:00.000Z');
      (doc as Mock).mockReturnValue({ id: 'client-uuid' });
      (setDoc as Mock).mockResolvedValue(undefined);

      const result = await repository.createIncidentWithId('client-uuid', {
        petId: 'pet-1',
        startedAt,
        userId,
        createdBy: userId,
      });

      expect(doc).toHaveBeenCalledWith(
        db,
        `users/${userId}/incidents`,
        'client-uuid'
      );
      expect(setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'client-uuid',
        petId: 'pet-1',
        userId,
        createdBy: userId,
        startedAt,
        endedAt: null,
        deletedAt: null,
        chips: [],
        journal: [],
      });
    });
  });

  describe('getById', () => {
    it('round-trips create → getById', async () => {
      const startedAt = new Date('2026-05-02T10:00:00.000Z');
      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue({
        exists: () => true,
        id: 'incident-id',
        data: () => ({
          petId: 'pet-1',
          userId,
          createdBy: userId,
          startedAt: { toDate: () => startedAt },
          endedAt: null,
          chips: [],
          journal: [],
          createdAt: { toDate: () => startedAt },
          updatedAt: { toDate: () => startedAt },
          deletedAt: null,
          type: null,
          severity: null,
        }),
      });

      const result = await repository.getById('incident-id');

      expect(doc).toHaveBeenCalledWith(
        db,
        `users/${userId}/incidents`,
        'incident-id'
      );
      expect(result).toMatchObject({
        id: 'incident-id',
        petId: 'pet-1',
        startedAt,
      });
    });

    it('returns null when the incident does not exist', async () => {
      (doc as Mock).mockReturnValue({});
      (getDoc as Mock).mockResolvedValue({ exists: () => false });

      const result = await repository.getById('missing');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('changes only the specified fields and bumps updatedAt', async () => {
      const endedAt = new Date('2026-05-02T10:30:00.000Z');
      (doc as Mock).mockReturnValue({});
      (updateDoc as Mock).mockResolvedValue(undefined);
      (getDoc as Mock)
        .mockResolvedValueOnce({ exists: () => true })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'incident-id',
          data: () => ({
            petId: 'pet-1',
            userId,
            createdBy: userId,
            endedAt: { toDate: () => endedAt },
            chips: [],
            journal: [],
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            startedAt: { toDate: () => new Date() },
            deletedAt: null,
            type: null,
            severity: null,
          }),
        });

      const result = await repository.update('incident-id', { endedAt });

      expect(doc).toHaveBeenCalledWith(
        db,
        `users/${userId}/incidents`,
        'incident-id'
      );
      const updateArgs = (updateDoc as Mock).mock.calls[0][1];
      expect(updateArgs).toHaveProperty('endedAt');
      expect(updateArgs).toHaveProperty('updatedAt');
      // petId and other fields must not appear in the patch
      expect(updateArgs).not.toHaveProperty('petId');
      expect(result.endedAt).toEqual(endedAt);
    });
  });

  describe('findActiveForUser', () => {
    it('queries endedAt == null AND deletedAt == null and returns the single result', async () => {
      const startedAt = new Date('2026-05-02T10:00:00.000Z');
      (getDocs as Mock).mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'active-1',
            data: () => ({
              petId: 'pet-1',
              userId,
              createdBy: userId,
              startedAt: { toDate: () => startedAt },
              endedAt: null,
              chips: [],
              journal: [],
              createdAt: { toDate: () => startedAt },
              updatedAt: { toDate: () => startedAt },
              deletedAt: null,
              type: null,
              severity: null,
            }),
          },
        ],
      });

      const result = await repository.findActiveForUser();

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('endedAt', '==', null);
      expect(where).toHaveBeenCalledWith('deletedAt', '==', null);
      expect(limit).toHaveBeenCalledWith(1);
      expect(result).toMatchObject({ id: 'active-1', petId: 'pet-1' });
    });

    it('returns null when no active incident exists', async () => {
      (getDocs as Mock).mockResolvedValue({ empty: true, docs: [] });

      const result = await repository.findActiveForUser();
      expect(result).toBeNull();
    });
  });
});

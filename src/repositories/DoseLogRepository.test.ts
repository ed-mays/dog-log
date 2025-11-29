import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DoseLogRepository } from './DoseLogRepository';
import {
  collection,
  where,
  getDocs,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@app-firebase';
import type {
  DoseLogCreateInput,
  DoseLogUpdateInput,
} from '@features/medications/types';

// Mock Firebase modules
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
  };
});

vi.mock('@app-firebase', () => ({
  db: {},
}));

describe('DoseLogRepository', () => {
  const userId = 'test-user';
  const petId = 'test-pet';
  let repository: DoseLogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new DoseLogRepository(userId, petId);
  });

  describe('createDoseLog', () => {
    it('should create a dose log', async () => {
      const input: DoseLogCreateInput = {
        petId,
        petMedicationId: 'med-1',
        amountGiven: 1,
        doseUnit: 'tablet',
        status: 'given',
        timestampGiven: new Date().toISOString(),
        createdBy: userId,
      };
      const mockDocRef = { id: 'new-log-id' };
      vi.mocked(addDoc).mockResolvedValue(
        mockDocRef as unknown as DocumentReference
      );

      const result = await repository.createDoseLog(input);

      expect(collection).toHaveBeenCalledWith(
        db,
        `users/${userId}/pets/${petId}/doseLogs`
      );
      expect(addDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-log-id');
    });

    it('should handle errors during creation', async () => {
      vi.mocked(addDoc).mockRejectedValue(new Error('Create failed'));
      await expect(
        repository.createDoseLog({} as DoseLogCreateInput)
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateDoseLog', () => {
    it('should update a dose log', async () => {
      const logId = 'log-1';
      const updates: DoseLogUpdateInput = { amountGiven: 2 };
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ ...updates }),
        id: logId,
      };

      vi.mocked(doc).mockReturnValue({} as unknown as DocumentReference);
      vi.mocked(getDoc).mockResolvedValue(
        mockDocSnap as unknown as DocumentSnapshot
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await repository.updateDoseLog(logId, updates);

      expect(doc).toHaveBeenCalledWith(
        db,
        `users/${userId}/pets/${petId}/doseLogs`,
        logId
      );
      expect(updateDoc).toHaveBeenCalled();
      expect(result.amountGiven).toBe(2);
    });

    it('should handle errors during update', async () => {
      const logId = 'log-1';
      vi.mocked(doc).mockReturnValue({} as unknown as DocumentReference);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as unknown as DocumentSnapshot);
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      await expect(
        repository.updateDoseLog(logId, { amountGiven: 2 })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getDoseLogsByMedicationId', () => {
    it('should query dose logs by medication id', async () => {
      const petMedicationId = 'med-1';
      const mockDocs = [
        {
          id: 'log-1',
          data: () => ({
            petMedicationId,
            amountGiven: 1,
            timestampGiven: { toDate: () => new Date('2023-01-01') },
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as unknown as QuerySnapshot);

      const result =
        await repository.getDoseLogsByMedicationId(petMedicationId);

      expect(collection).toHaveBeenCalledWith(
        db,
        `users/${userId}/pets/${petId}/doseLogs`
      );
      expect(where).toHaveBeenCalledWith(
        'petMedicationId',
        '==',
        petMedicationId
      );
      expect(orderBy).toHaveBeenCalledWith('timestampGiven', 'desc');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('log-1');
    });
  });

  describe('getAllDoseLogs', () => {
    it('should query all dose logs ordered by timestamp', async () => {
      const mockDocs = [
        {
          id: 'log-1',
          data: () => ({
            amountGiven: 1,
            timestampGiven: { toDate: () => new Date('2023-01-01') },
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as unknown as QuerySnapshot);

      const result = await repository.getAllDoseLogs();

      expect(collection).toHaveBeenCalledWith(
        db,
        `users/${userId}/pets/${petId}/doseLogs`
      );
      expect(orderBy).toHaveBeenCalledWith('timestampGiven', 'desc');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('log-1');
    });
  });
});

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { PetMedicationRepository } from './PetMedicationRepository';
import { db } from '@app-firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import type { PetMedicationCreateInput } from '@features/medications/types';

// Mock Firebase
vi.mock('@app-firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
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

describe('PetMedicationRepository', () => {
  let repository: PetMedicationRepository;
  const userId = 'user-1';
  const petId = 'pet-1';

  beforeEach(() => {
    repository = new PetMedicationRepository(userId, petId);
    vi.clearAllMocks();
  });

  it('should create a pet medication', async () => {
    const input: PetMedicationCreateInput = {
      petId,
      medicationDefinitionId: 'med-1',
      form: 'pill',
      route: 'oral',
      doseAmount: 1,
      doseUnit: 'tablet',
      scheduleType: 'onceDaily',
      scheduleConfig: { startDate: '2023-01-01' },
      active: true,
      createdBy: 'user-1',
    };

    const mockDocRef = { id: 'new-id' };
    (addDoc as Mock).mockResolvedValue(mockDocRef);

    const result = await repository.createPetMedication(input);

    expect(collection).toHaveBeenCalledWith(
      db,
      `users/${userId}/pets/${petId}/medications`
    );
    expect(addDoc).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 'new-id',
      petId,
    });
  });

  it('should update a pet medication', async () => {
    const updates = { active: false };
    const mockDocRef = {};
    (doc as Mock).mockReturnValue(mockDocRef);
    (updateDoc as Mock).mockResolvedValue(undefined);
    const mockGetDoc = {
      exists: () => true,
      data: () => ({ active: false, id: 'med-id' }),
      id: 'med-id',
    };
    (getDoc as Mock).mockResolvedValue(mockGetDoc);

    const result = await repository.updatePetMedication('med-id', updates);

    expect(doc).toHaveBeenCalledWith(
      db,
      `users/${userId}/pets/${petId}/medications`,
      'med-id'
    );
    expect(updateDoc).toHaveBeenCalled();
    expect(result.active).toBe(false);
  });

  it('should get active pet medications', async () => {
    const mockDocs = [
      {
        data: () => ({ id: '1', active: true }),
        id: '1',
      },
      {
        data: () => ({ id: '2', active: true }),
        id: '2',
      },
    ];
    (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

    const result = await repository.getActivePetMedications();

    expect(query).toHaveBeenCalled();
    expect(where).toHaveBeenCalledWith('active', '==', true);
    expect(result).toHaveLength(2);
  });
});

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { MedicationRepository } from './MedicationRepository';
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
import type { MedicationDefinitionCreateInput } from '@features/medications/types';

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

describe('MedicationRepository', () => {
  let repository: MedicationRepository;

  beforeEach(() => {
    repository = new MedicationRepository();
    vi.clearAllMocks();
  });

  it('should create a medication', async () => {
    const input: MedicationDefinitionCreateInput = {
      name: 'Flea Meds',
      defaultForm: 'pill',
      defaultRoute: 'oral',
      isArchived: false,
      createdBy: 'user-1',
    };

    const mockDocRef = { id: 'new-id' };
    (addDoc as Mock).mockResolvedValue(mockDocRef);

    const result = await repository.createMedication(input);

    expect(collection).toHaveBeenCalledWith(db, 'medicationDefinitions');
    expect(addDoc).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 'new-id',
      name: 'Flea Meds',
    });
  });

  it('should update a medication', async () => {
    const updates = { name: 'Updated Meds' };
    const mockDocRef = {};
    (doc as Mock).mockReturnValue(mockDocRef);
    (updateDoc as Mock).mockResolvedValue(undefined);
    // Mock getDoc for the return value of update
    const mockGetDoc = {
      exists: () => true,
      data: () => ({ name: 'Updated Meds', id: 'med-id' }),
      id: 'med-id',
    };
    (getDoc as Mock).mockResolvedValue(mockGetDoc);

    const result = await repository.updateMedication('med-id', updates);

    expect(doc).toHaveBeenCalledWith(db, 'medicationDefinitions', 'med-id');
    expect(updateDoc).toHaveBeenCalled();
    expect(result.name).toBe('Updated Meds');
  });

  it('should get active list', async () => {
    const mockDocs = [
      {
        data: () => ({ name: 'Med 1', isArchived: false }),
        id: '1',
      },
      {
        data: () => ({ name: 'Med 2', isArchived: false }),
        id: '2',
      },
    ];
    (getDocs as Mock).mockResolvedValue({ docs: mockDocs });

    const result = await repository.getActiveList();

    expect(query).toHaveBeenCalled();
    expect(where).toHaveBeenCalledWith('isArchived', '==', false);
    expect(result).toHaveLength(2);
  });
});

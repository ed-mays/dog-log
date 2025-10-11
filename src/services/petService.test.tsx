import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PetService } from './petService';
import { PetRepository } from '@repositories/petRepository';
import type { Pet, PetCreateInput } from '@features/petManagement/types';

// Mock the repository dependency
vi.mock('@repositories/petRepository');

describe('PetService', () => {
  let service: PetService;
  const testUserId = 'user-123';

  // Mock implementation for PetRepository methods
  const mockGetActivePets = vi.fn();
  const mockGetArchivedPets = vi.fn();
  const mockCreatePet = vi.fn();
  const mockUpdatePet = vi.fn();
  const mockArchivePet = vi.fn();

  // Before each test, reset mocks and service instance
  beforeEach(() => {
    // Make the PetRepository mock return our mock methods
    PetRepository.mockImplementation(() => {
      return {
        getActivePets: mockGetActivePets,
        getArchivedPets: mockGetArchivedPets,
        createPet: mockCreatePet,
        updatePet: mockUpdatePet,
        archivePet: mockArchivePet,
      };
    });

    service = new PetService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchActivePets should create a repository and call getActivePets', async () => {
    mockGetActivePets.mockResolvedValue([]);
    await service.fetchActivePets(testUserId);

    expect(PetRepository).toHaveBeenCalledWith(testUserId);
    expect(mockGetActivePets).toHaveBeenCalledWith(undefined);
  });

  it('fetchArchivedPets should create a repository and call getArchivedPets', async () => {
    mockGetArchivedPets.mockResolvedValue([]);
    await service.fetchArchivedPets(testUserId);

    expect(PetRepository).toHaveBeenCalledWith(testUserId);
    expect(mockGetArchivedPets).toHaveBeenCalledWith(undefined);
  });

  it('addPet should create a repository and call createPet', async () => {
    const input: PetCreateInput = {
      name: 'Rex',
      breed: 'Lab',
      birthDate: new Date(),
    };
    const expectedPet: Pet = {
      id: 'pet-1',
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: testUserId,
      ...input,
    };
    mockCreatePet.mockResolvedValue(expectedPet);

    const result = await service.addPet(testUserId, input);

    expect(PetRepository).toHaveBeenCalledWith(testUserId);
    expect(mockCreatePet).toHaveBeenCalledWith(input);
    expect(result).toEqual(expectedPet);
  });

  it('editPet should create a repository and call updatePet', async () => {
    const updates = { name: 'Rexy' };
    mockUpdatePet.mockResolvedValue({} as Pet);

    await service.editPet(testUserId, 'pet-1', updates);

    expect(PetRepository).toHaveBeenCalledWith(testUserId);
    expect(mockUpdatePet).toHaveBeenCalledWith('pet-1', updates);
  });

  it('archivePet should create a repository and call archivePet', async () => {
    mockArchivePet.mockResolvedValue({} as Pet);
    await service.archivePet(testUserId, 'pet-1');

    expect(PetRepository).toHaveBeenCalledWith(testUserId);
    expect(mockArchivePet).toHaveBeenCalledWith('pet-1');
  });
});

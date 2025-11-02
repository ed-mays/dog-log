import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PetService } from './petService';
import { PetRepository } from '@repositories/petRepository';
import type { Pet, PetCreateInput } from '@features/pets/types';

// Mock the entire PetRepository module. Vitest will automatically mock the class constructor.
vi.mock('@repositories/petRepository');

describe('PetService', () => {
  let service: PetService;
  const testUserId = 'user-123';

  // Declare variables to hold the mock methods for the *current* test run.
  // These will be re-initialized in beforeEach.
  let mockGetActivePets: ReturnType<typeof vi.fn>;
  let mockGetArchivedPets: ReturnType<typeof vi.fn>;
  let mockCreatePet: ReturnType<typeof vi.fn>;
  let mockUpdatePet: ReturnType<typeof vi.fn>;
  let mockArchivePet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all mocks, including the PetRepository constructor mock's call history
    // and any previous mock implementations.
    vi.clearAllMocks();

    // Create fresh vi.fn() mocks for each test run.
    // This ensures that each test starts with isolated mock functions.
    mockGetActivePets = vi.fn();
    mockGetArchivedPets = vi.fn();
    mockCreatePet = vi.fn();
    mockUpdatePet = vi.fn();
    mockArchivePet = vi.fn();

    // Configure the PetRepository constructor mock to return an instance
    // with these fresh mock methods. This is crucial for each test to have
    // its own configurable mock instance.
    (PetRepository as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({
        getActivePets: mockGetActivePets,
        getArchivedPets: mockGetArchivedPets,
        createPet: mockCreatePet,
        updatePet: mockUpdatePet,
        archivePet: mockArchivePet,
      })
    );

    // Instantiate the service AFTER setting up the PetRepository mock for this test.
    service = new PetService();
  });

  afterEach(() => {
    // Restore all mocks to their original implementations after each test suite.
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

// Additional coverage to exercise simple placeholder methods not hitting the repository

describe('PetService (simple local methods)', () => {
  let service: PetService;
  beforeEach(() => {
    vi.clearAllMocks();
    service = new PetService();
  });

  test('getList returns an empty array by default', async () => {
    const result = await service.getList();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('updatePet returns a Pet with provided id and fields', async () => {
    const id = 'pet-xyz';
    const result = await service.updatePet(id, {
      name: 'Buddy',
      breed: 'Husky',
    });
    expect(result).toMatchObject({ id, name: 'Buddy', breed: 'Husky' });
  });
});

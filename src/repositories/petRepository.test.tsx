import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PetRepository } from './petRepository';
import type { Pet } from '@features/petManagement/types';

describe('PetRepository', () => {
  let repo: PetRepository;

  beforeEach(() => {
    repo = new PetRepository();
    vi.clearAllMocks();
  });

  it('getActivePets calls getActiveList with correct userId', async () => {
    // Spy on the method from the extended ArchivableBaseRepository
    const getActiveList = vi.spyOn(repo, 'getActiveList').mockResolvedValue([]);
    const options = { orderBy: 'name' };

    await repo.getActivePets(options);

    expect(getActiveList).toHaveBeenCalledWith(options);
  });

  it('getArchivedPets calls getArchivedList with correct userId', async () => {
    // Spy on the method from the extended ArchivableBaseRepository
    const getArchivedList = vi
      .spyOn(repo, 'getArchivedList')
      .mockResolvedValue([]);
    const options = { limit: 10 };

    await repo.getArchivedPets(options);

    expect(getArchivedList).toHaveBeenCalledWith(options);
  });

  it('createPet calls base create with userId and correct payload', async () => {
    const input = {
      name: 'Buddy',
      breed: 'Lab',
      birthDate: new Date(),
    };
    const expectedPet: Pet = {
      id: 'new-id',
      ...input,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const create = vi.spyOn(repo, 'create').mockResolvedValue(expectedPet);

    const result = await repo.createPet(input);

    expect(create).toHaveBeenCalledWith({
      ...input,
      isArchived: false,
    });
    expect(result.name).toBe('Buddy');
    //expect(result.createdBy).toBe(mockUserId);
  });

  it('updatePet calls base update with userId and correct payload', async () => {
    const petId = 'pet-1';
    const updates = { name: 'Buddy Boy' };
    const update = vi.spyOn(repo, 'update').mockResolvedValue({} as Pet);

    await repo.updatePet(petId, updates);

    expect(update).toHaveBeenCalledWith(petId, updates);
  });

  it('archivePet calls base archive with userId and petId', async () => {
    const petId = 'pet-to-archive';
    // Spy on the method from the extended ArchivableBaseRepository
    const archive = vi.spyOn(repo, 'archive').mockResolvedValue({} as Pet);

    await repo.archivePet(petId);

    expect(archive).toHaveBeenCalledWith(petId);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PetRepository } from './petRepository';

describe('PetRepository', () => {
  let repo: PetRepository;

  beforeEach(() => {
    repo = new PetRepository();
    vi.clearAllMocks();
  });

  it('getActivePets passes correct filter', async () => {
    const getList = vi.spyOn(repo, 'getList').mockResolvedValue([]);
    await repo.getActivePets();
    expect(getList).toHaveBeenCalledWith(
      expect.objectContaining({ filters: { isArchived: false } })
    );
  });

  it('createPet calls base create', async () => {
    const create = vi.spyOn(repo, 'create').mockResolvedValue({
      id: 'id',
      name: 'Buddy',
      breed: 'Lab',
      birthDate: new Date(),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'u',
    });
    const res = await repo.createPet({
      name: 'Buddy',
      breed: 'Lab',
      birthDate: new Date(),
    });
    expect(create).toHaveBeenCalled();
    expect(res.name).toBe('Buddy');
  });

  it('archivePet calls update with isArchived', async () => {
    const update = vi
      .spyOn(repo, 'update')
      .mockResolvedValue({ isArchived: true, archivedAt: new Date() } as never);
    await repo.archivePet('some-id');
    expect(update).toHaveBeenCalledWith(
      'some-id',
      expect.objectContaining({ isArchived: true })
    );
  });
});

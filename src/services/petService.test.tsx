import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PetService } from './petService';
import { PetRepository } from '@repositories/petRepository';

describe('PetService', () => {
  let repo: PetRepository;
  let service: PetService;

  beforeEach(() => {
    repo = new PetRepository();
    service = new PetService(repo);
    vi.clearAllMocks();
  });

  it('fetchActivePets calls repo.getActivePets', async () => {
    const spy = vi.spyOn(repo, 'getActivePets').mockResolvedValue([]);
    await service.fetchActivePets();
    expect(spy).toHaveBeenCalled();
  });

  it('addPet delegates to repo.createPet', async () => {
    const spy = vi.spyOn(repo, 'createPet').mockResolvedValue({
      id: 'id',
      name: 'Rex',
      breed: 'Lab',
      birthDate: new Date(),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'me',
    });
    const out = await service.addPet({
      name: 'Rex',
      breed: 'Lab',
      birthDate: new Date(),
    });
    expect(spy).toHaveBeenCalled();
    expect(out.name).toBe('Rex');
  });

  it('archivePet calls repo.archivePet', async () => {
    const spy = vi
      .spyOn(repo, 'archivePet')
      .mockResolvedValue({ isArchived: true } as never);
    await service.archivePet('id');
    expect(spy).toHaveBeenCalledWith('id');
  });
});

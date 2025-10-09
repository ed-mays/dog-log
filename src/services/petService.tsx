import { PetRepository } from '@repositories/petRepository';
import type {
  PetCreateInput,
  PetUpdateInput,
  PetQueryOptions,
  Pet,
} from '@features/petManagement/types';

export class PetService {
  async fetchActivePets(
    userId: string,
    options?: PetQueryOptions
  ): Promise<Pet[]> {
    const repo = new PetRepository(userId);
    return repo.getActivePets(options);
  }

  async fetchArchivedPets(
    userId: string,
    options?: PetQueryOptions
  ): Promise<Pet[]> {
    const repo = new PetRepository(userId);
    return repo.getArchivedPets(options);
  }

  async addPet(userId: string, input: PetCreateInput): Promise<Pet> {
    const repo = new PetRepository(userId);
    return repo.createPet(input);
  }

  async editPet(
    userId: string,
    id: string,
    updates: PetUpdateInput
  ): Promise<Pet> {
    const repo = new PetRepository(userId);
    return repo.updatePet(id, updates);
  }

  async archivePet(userId: string, id: string): Promise<Pet> {
    const repo = new PetRepository(userId);
    return repo.archivePet(id);
  }
}

export const petService = new PetService();

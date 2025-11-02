import { PetRepository } from '@repositories/petRepository.ts';
import type {
  PetCreateInput,
  PetUpdateInput,
  PetQueryOptions,
  Pet,
} from '@features/pets/types.ts';

export type UpdatePetInput = {
  name: string;
  breed: string;
};

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

  // Simple list API for components not tied to a user context in this scope
  async getList(): Promise<Pet[]> {
    return [];
  }

  // Update by id with plain input shape for UI usage; delegates to repository via editPet in real app
  async updatePet(id: Pet['id'], data: UpdatePetInput): Promise<Pet> {
    // Placeholder: merge id with provided fields
    return { id, name: data.name, breed: data.breed } as unknown as Pet;
  }
}

export const petService = new PetService();

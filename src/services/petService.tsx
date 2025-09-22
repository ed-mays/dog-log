import { PetRepository } from '@repositories/petRepository';
import type {
  PetCreateInput,
  PetUpdateInput,
  PetQueryOptions,
  Pet,
} from '@features/petManagement/types';

export class PetService {
  private repo: PetRepository;

  constructor(repo?: PetRepository) {
    // Allow manual injection for testability
    this.repo = repo ?? new PetRepository();
  }

  async fetchActivePets(options?: PetQueryOptions): Promise<Pet[]> {
    return this.repo.getActivePets(options);
  }

  async fetchArchivedPets(options?: PetQueryOptions): Promise<Pet[]> {
    return this.repo.getArchivedPets(options);
  }

  async addPet(input: PetCreateInput): Promise<Pet> {
    // Add input validation logic here if needed.
    return this.repo.createPet(input);
  }

  async editPet(id: string, updates: PetUpdateInput): Promise<Pet> {
    // Add update validation logic here if needed.
    return this.repo.updatePet(id, updates);
  }

  async archivePet(id: string): Promise<Pet> {
    return this.repo.archivePet(id);
  }
}

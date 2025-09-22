import { BaseRepository } from './base/BaseRepository';
import type {
  Pet,
  PetCreateInput,
  PetUpdateInput,
  PetQueryOptions,
} from '@features/petManagement/types';
import { COLLECTIONS } from './config';

export class PetRepository extends BaseRepository<Pet> {
  constructor() {
    super(COLLECTIONS.PETS);
  }

  async getActivePets(options: PetQueryOptions = {}) {
    // All pets with isArchived === false
    return this.getList({ ...options, filters: { isArchived: false } });
  }

  async getArchivedPets(options: PetQueryOptions = {}) {
    // All pets with isArchived === true
    return this.getList({ ...options, filters: { isArchived: true } });
  }

  async createPet(input: PetCreateInput) {
    // Transforms input and delegates to BaseRepository.create
    return this.create(input);
  }

  async updatePet(id: string, updates: PetUpdateInput) {
    // Transforms updates and delegates to BaseRepository.update
    return this.update(id, updates);
  }

  async archivePet(id: string) {
    // Set isArchived to true
    return this.update(id, { isArchived: true, archivedAt: new Date() });
  }
}

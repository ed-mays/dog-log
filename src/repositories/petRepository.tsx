import { ArchivableBaseRepository } from './base/BaseRepository';
import type {
  Pet,
  PetCreateInput,
  PetQueryOptions,
  PetUpdateInput,
} from '@features/petManagement/types';
import { COLLECTIONS } from './config';

export class PetRepository extends ArchivableBaseRepository<Pet> {
  constructor() {
    super(COLLECTIONS.PETS);
  }

  async getActivePets(userId: string, options: PetQueryOptions = {}) {
    // All pets with isArchived === false
    return this.getActiveList(userId, options);
  }

  async getArchivedPets(userId: string, options: PetQueryOptions = {}) {
    // All pets with isArchived === true
    return this.getArchivedList(userId, options);
  }

  async createPet(userId: string, input: PetCreateInput) {
    // Transforms input and delegates to BaseRepository.create
    return this.create(userId, { ...input, isArchived: false });
  }

  async updatePet(userId: string, id: string, updates: PetUpdateInput) {
    // Transforms updates and delegates to BaseRepository.update
    return this.update(userId, id, updates);
  }

  async archivePet(userId: string, id: string) {
    // Set isArchived to true
    return this.archive(userId, id);
  }
}

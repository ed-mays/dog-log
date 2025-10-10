import { ArchivableBaseRepository } from './base/BaseRepository';
import type {
  Pet,
  PetCreateInput,
  PetQueryOptions,
  PetUpdateInput,
} from '@features/petManagement/types';

export class PetRepository extends ArchivableBaseRepository<Pet> {
  private readonly userId: string;
  constructor(userId: string) {
    super(`users/${userId}/pets`);
    this.userId = userId;
  }

  async getActivePets(options: PetQueryOptions = {}) {
    // All pets with isArchived === false
    return this.getActiveList(options);
  }

  async getArchivedPets(options: PetQueryOptions = {}) {
    // All pets with isArchived === true
    return this.getArchivedList(options);
  }

  async createPet(input: PetCreateInput) {
    // Transforms input and delegates to BaseRepository.create
    return this.create({
      ...input,
      isArchived: false,
      createdBy: this.userId,
    } as any);
  }

  async updatePet(id: string, updates: PetUpdateInput) {
    // Transforms updates and delegates to BaseRepository.update
    return this.update(id, updates);
  }

  async archivePet(id: string) {
    // Set isArchived to true
    return this.archive(id);
  }
}

import { BaseRepository } from './base/BaseRepository';
import type {
  Feeding,
  FeedingCreateInput,
  FeedingUpdateInput,
} from '@features/feedings/types';
import type { QueryOptions } from '@repositories/types';

export class FeedingRepository extends BaseRepository<Feeding> {
  constructor(userId: string, petId: string) {
    super(`users/${userId}/pets/${petId}/feedings`);
  }

  async getFeedings(options: QueryOptions = {}) {
    return this.getList(options);
  }

  async createFeeding(input: FeedingCreateInput) {
    return this.create(input);
  }

  async updateFeeding(id: string, updates: FeedingUpdateInput) {
    return this.update(id, updates);
  }

  async deleteFeeding(id: string) {
    return this.delete(id);
  }
}

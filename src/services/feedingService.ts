import { FeedingRepository } from '@repositories/feedingRepository';
import type {
  Feeding,
  FeedingCreateInput,
  FeedingUpdateInput,
} from '@features/feedings/types';
import type { QueryOptions } from '@repositories/types';

export class FeedingService {
  async getFeedings(
    userId: string,
    petId: string,
    options?: QueryOptions
  ): Promise<Feeding[]> {
    const repo = new FeedingRepository(userId, petId);
    return repo.getFeedings(options);
  }

  async addFeeding(
    userId: string,
    petId: string,
    input: FeedingCreateInput
  ): Promise<Feeding> {
    const repo = new FeedingRepository(userId, petId);
    return repo.createFeeding(input);
  }

  async updateFeeding(
    userId: string,
    petId: string,
    feedingId: string,
    updates: FeedingUpdateInput
  ): Promise<Feeding> {
    const repo = new FeedingRepository(userId, petId);
    return repo.updateFeeding(feedingId, updates);
  }

  async deleteFeeding(
    userId: string,
    petId: string,
    feedingId: string
  ): Promise<void> {
    const repo = new FeedingRepository(userId, petId);
    return repo.deleteFeeding(feedingId);
  }
}

export const feedingService = new FeedingService();

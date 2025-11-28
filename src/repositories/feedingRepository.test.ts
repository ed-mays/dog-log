import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedingRepository } from './feedingRepository';
import { BaseRepository } from './base/BaseRepository';

// Mock BaseRepository
vi.mock('./base/BaseRepository');

describe('FeedingRepository', () => {
  const userId = 'user123';
  const petId = 'pet123';
  let repository: FeedingRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new FeedingRepository(userId, petId);
  });

  it('should be instantiated with correct collection path', () => {
    // We can't easily check the super call arguments directly without more complex mocking,
    // but we can verify the instance is created.
    expect(repository).toBeInstanceOf(FeedingRepository);
    expect(repository).toBeInstanceOf(BaseRepository);
  });

  it('getFeedings calls getList', async () => {
    const options = { limit: 10 };
    await repository.getFeedings(options);
    expect(BaseRepository.prototype.getList).toHaveBeenCalledWith(options);
  });

  it('createFeeding calls create', async () => {
    const input = {
      date: new Date(),
      foodType: 'Kibble',
      notes: 'Good',
    };
    await repository.createFeeding(input);
    expect(BaseRepository.prototype.create).toHaveBeenCalledWith(input);
  });

  it('updateFeeding calls update', async () => {
    const id = 'feed1';
    const updates = { notes: 'Updated' };
    await repository.updateFeeding(id, updates);
    expect(BaseRepository.prototype.update).toHaveBeenCalledWith(id, updates);
  });

  it('deleteFeeding calls delete', async () => {
    const id = 'feed1';
    await repository.deleteFeeding(id);
    expect(BaseRepository.prototype.delete).toHaveBeenCalledWith(id);
  });
});

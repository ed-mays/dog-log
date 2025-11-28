import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedingService } from './feedingService';
import { FeedingRepository } from '@repositories/feedingRepository';

// Mock FeedingRepository
vi.mock('@repositories/feedingRepository');

describe('FeedingService', () => {
  let service: FeedingService;
  const userId = 'user123';
  const petId = 'pet123';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FeedingService();
  });

  it('getFeedings instantiates repo and calls getFeedings', async () => {
    const options = { limit: 5 };
    const mockGetFeedings = vi.fn().mockResolvedValue([]);
    vi.mocked(FeedingRepository).mockImplementation(
      () =>
        ({
          getFeedings: mockGetFeedings,
        }) as unknown as FeedingRepository
    );

    await service.getFeedings(userId, petId, options);

    expect(FeedingRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockGetFeedings).toHaveBeenCalledWith(options);
  });

  it('addFeeding instantiates repo and calls createFeeding', async () => {
    const input = { date: new Date(), foodType: 'Wet' };
    const mockCreateFeeding = vi.fn().mockResolvedValue({ id: '1', ...input });
    vi.mocked(FeedingRepository).mockImplementation(
      () =>
        ({
          createFeeding: mockCreateFeeding,
        }) as unknown as FeedingRepository
    );

    await service.addFeeding(userId, petId, input);

    expect(FeedingRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockCreateFeeding).toHaveBeenCalledWith(input);
  });

  it('updateFeeding instantiates repo and calls updateFeeding', async () => {
    const feedingId = 'feed1';
    const updates = { notes: 'Updated' };
    const mockUpdateFeeding = vi
      .fn()
      .mockResolvedValue({ id: feedingId, ...updates });
    vi.mocked(FeedingRepository).mockImplementation(
      () =>
        ({
          updateFeeding: mockUpdateFeeding,
        }) as unknown as FeedingRepository
    );

    await service.updateFeeding(userId, petId, feedingId, updates);

    expect(FeedingRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockUpdateFeeding).toHaveBeenCalledWith(feedingId, updates);
  });

  it('deleteFeeding instantiates repo and calls deleteFeeding', async () => {
    const feedingId = 'feed1';
    const mockDeleteFeeding = vi.fn().mockResolvedValue(undefined);
    vi.mocked(FeedingRepository).mockImplementation(
      () =>
        ({
          deleteFeeding: mockDeleteFeeding,
        }) as unknown as FeedingRepository
    );

    await service.deleteFeeding(userId, petId, feedingId);

    expect(FeedingRepository).toHaveBeenCalledWith(userId, petId);
    expect(mockDeleteFeeding).toHaveBeenCalledWith(feedingId);
  });
});

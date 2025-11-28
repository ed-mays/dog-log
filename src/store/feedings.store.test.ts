import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFeedingsStore } from './feedings.store';
import { feedingService } from '@services/feedingService';
import { useAuthStore } from '@store/auth.store';
import { act } from '@testing-library/react';
import type {
  Feeding,
  FeedingCreateInput,
  FeedingUpdateInput,
} from '@features/feedings/types';
import type { AppUser } from '@services/auth/authService';

// Mock dependencies
vi.mock('@services/feedingService');
vi.mock('@store/auth.store');

describe('useFeedingsStore', () => {
  const mockUser: AppUser = {
    uid: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
  };
  const petId = 'pet123';

  beforeEach(() => {
    vi.clearAllMocks();
    useFeedingsStore.getState().reset();
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: mockUser,
    } as unknown as ReturnType<typeof useAuthStore.getState>);
  });

  it('fetchFeedings success', async () => {
    const mockFeedings: Feeding[] = [
      {
        id: '1',
        date: new Date('2023-01-01'),
        foodType: 'A',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
      },
      {
        id: '2',
        date: new Date('2023-01-02'),
        foodType: 'B',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
      },
    ];
    vi.mocked(feedingService.getFeedings).mockResolvedValue(mockFeedings);

    await act(async () => {
      await useFeedingsStore.getState().fetchFeedings(petId);
    });

    const state = useFeedingsStore.getState();
    expect(state.feedings).toEqual(mockFeedings);
    expect(state.isFetching).toBe(false);
    expect(state.fetchError).toBeNull();
    expect(feedingService.getFeedings).toHaveBeenCalledWith(
      mockUser.uid,
      petId,
      expect.objectContaining({ orderBy: 'date' })
    );
  });

  it('fetchFeedings error', async () => {
    const error = new Error('Fetch failed');
    vi.mocked(feedingService.getFeedings).mockRejectedValue(error);

    await act(async () => {
      await useFeedingsStore.getState().fetchFeedings(petId);
    });

    const state = useFeedingsStore.getState();
    expect(state.feedings).toEqual([]);
    expect(state.isFetching).toBe(false);
    expect(state.fetchError).toEqual(error);
  });

  it('fetchFeedings without user clears state', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
    } as unknown as ReturnType<typeof useAuthStore.getState>);

    await act(async () => {
      await useFeedingsStore.getState().fetchFeedings(petId);
    });

    const state = useFeedingsStore.getState();
    expect(state.feedings).toEqual([]);
    expect(feedingService.getFeedings).not.toHaveBeenCalled();
  });

  it('addFeeding success', async () => {
    const input: FeedingCreateInput = {
      date: new Date(),
      foodType: 'New',
      notes: 'Note',
    };
    const newFeeding: Feeding = {
      id: 'new',
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    };
    vi.mocked(feedingService.addFeeding).mockResolvedValue(newFeeding);

    await act(async () => {
      await useFeedingsStore.getState().addFeeding(petId, input);
    });

    const state = useFeedingsStore.getState();
    expect(state.feedings).toContainEqual(newFeeding);
    expect(feedingService.addFeeding).toHaveBeenCalledWith(
      mockUser.uid,
      petId,
      input
    );
  });

  it('addFeeding throws if no user', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
    } as unknown as ReturnType<typeof useAuthStore.getState>);
    await expect(
      useFeedingsStore.getState().addFeeding(petId, {} as FeedingCreateInput)
    ).rejects.toThrow('User is not authenticated');
  });

  it('updateFeeding success', async () => {
    const existing: Feeding = {
      id: '1',
      date: new Date(),
      foodType: 'Old',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    };
    useFeedingsStore.setState({ feedings: [existing] });

    const updates: FeedingUpdateInput = { foodType: 'Updated' };
    const updated: Feeding = { ...existing, ...updates };
    vi.mocked(feedingService.updateFeeding).mockResolvedValue(updated);

    await act(async () => {
      await useFeedingsStore.getState().updateFeeding(petId, '1', updates);
    });

    const state = useFeedingsStore.getState();
    expect(state.feedings[0]).toEqual(updated);
    expect(feedingService.updateFeeding).toHaveBeenCalledWith(
      mockUser.uid,
      petId,
      '1',
      updates
    );
  });

  it('deleteFeeding success', async () => {
    const existing: Feeding = {
      id: '1',
      date: new Date(),
      foodType: 'Old',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    };
    useFeedingsStore.setState({ feedings: [existing] });

    vi.mocked(feedingService.deleteFeeding).mockResolvedValue(undefined);

    await act(async () => {
      await useFeedingsStore.getState().deleteFeeding(petId, '1');
    });

    const state = useFeedingsStore.getState();
    expect(state.feedings).toHaveLength(0);
    expect(feedingService.deleteFeeding).toHaveBeenCalledWith(
      mockUser.uid,
      petId,
      '1'
    );
  });
});

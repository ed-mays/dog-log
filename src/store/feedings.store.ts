import { create } from 'zustand';
import type {
  Feeding,
  FeedingCreateInput,
  FeedingUpdateInput,
} from '@features/feedings/types';
import { feedingService } from '@services/feedingService';
import { useAuthStore } from '@store/auth.store';

interface FeedingsState {
  feedings: Feeding[];
  isFetching: boolean;
  fetchError: Error | null;
  fetchFeedings: (petId: string) => Promise<void>;
  addFeeding: (petId: string, feeding: FeedingCreateInput) => Promise<void>;
  updateFeeding: (
    petId: string,
    feedingId: string,
    updates: FeedingUpdateInput
  ) => Promise<void>;
  deleteFeeding: (petId: string, feedingId: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  feedings: [],
  isFetching: false,
  fetchError: null,
};

export const useFeedingsStore = create<FeedingsState>((set) => ({
  ...initialState,
  fetchFeedings: async (petId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ feedings: [], isFetching: false, fetchError: null });
      return;
    }
    set({ isFetching: true, fetchError: null });
    try {
      const feedings = await feedingService.getFeedings(user.uid, petId, {
        orderBy: 'date',
        orderDirection: 'desc',
      });
      set({ feedings, isFetching: false });
    } catch (err) {
      const error = (err as Error) ?? new Error('Failed to load feedings.');
      set({ fetchError: error, isFetching: false });
    }
  },
  addFeeding: async (petId: string, feeding: FeedingCreateInput) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('User is not authenticated.');
    const newFeeding = await feedingService.addFeeding(
      user.uid,
      petId,
      feeding
    );
    set((state) => ({
      feedings: [newFeeding, ...state.feedings].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      ),
    }));
  },
  updateFeeding: async (
    petId: string,
    feedingId: string,
    updates: FeedingUpdateInput
  ) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('User is not authenticated.');
    const updated = await feedingService.updateFeeding(
      user.uid,
      petId,
      feedingId,
      updates
    );
    set((state) => ({
      feedings: state.feedings
        .map((f) => (f.id === feedingId ? { ...f, ...updated } : f))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    }));
  },
  deleteFeeding: async (petId: string, feedingId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('User is not authenticated.');
    await feedingService.deleteFeeding(user.uid, petId, feedingId);
    set((state) => ({
      feedings: state.feedings.filter((f) => f.id !== feedingId),
    }));
  },
  reset: () => {
    set(initialState);
  },
}));

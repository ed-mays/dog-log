import { create } from 'zustand';

interface UiState {
  loading: boolean;
  error: Error | null;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

const initialState = { loading: false, error: null };

export const useUiStore = create<UiState>((set) => ({
  ...initialState,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

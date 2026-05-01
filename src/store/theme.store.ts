import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'caregiver';

export const THEME_MODES: readonly ThemeMode[] = [
  'light',
  'dark',
  'caregiver',
] as const;

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
      cycleMode: () =>
        set((state) => {
          const i = THEME_MODES.indexOf(state.mode);
          const next = THEME_MODES[(i + 1) % THEME_MODES.length];
          return { mode: next };
        }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

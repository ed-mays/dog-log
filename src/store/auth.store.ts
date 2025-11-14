import { create } from 'zustand';
import type { AppUser, Unsubscribe } from '@services/auth/authService';
import {
  signInWithGoogle as serviceSignInWithGoogle,
  signOut as serviceSignOut,
  subscribeToAuth,
} from '@services/auth/authService';

export type AuthState = {
  user: AppUser | null;
  initializing: boolean;
  error: unknown | null;
  initAuthListener: () => Unsubscribe;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  reset: () => void;
};

let unsubscribe: Unsubscribe | null = null;
const initialState = {
  user: null,
  initializing: true,
  error: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  initAuthListener: () => {
    // Enter initializing state immediately
    set({ initializing: true });
    // Reinitialize listener safely if already set (useful for tests or HMR)
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch {
        // no-op
      }
      unsubscribe = null;
    }
    unsubscribe = subscribeToAuth(
      (user) => set({ user, initializing: false, error: null }),
      (error) => set({ error, initializing: false })
    );
    // Return the new unsubscribe so callers (e.g., bootstrap component) can clean up on unmount
    return unsubscribe;
  },
  signInWithGoogle: async () => {
    try {
      await serviceSignInWithGoogle();
      // user will be set by the listener
    } catch (error) {
      set({ error });
      throw error;
    }
  },
  signOut: async () => {
    try {
      await serviceSignOut();
      // user will be set to null by the listener
    } catch (error) {
      set({ error });
      throw error;
    }
  },
  reset: () => {
    set(initialState);
  },
}));

export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthStatus = () => ({
  initializing: useAuthStore((s) => s.initializing),
  error: useAuthStore((s) => s.error),
});

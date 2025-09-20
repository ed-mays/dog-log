import { create } from 'zustand';
import type { AppUser, Unsubscribe } from '@/services/auth/authService';
import {
  signInWithGoogle as serviceSignInWithGoogle,
  signOut as serviceSignOut,
  subscribeToAuth,
} from '@/services/auth/authService';

export type AuthState = {
  user: AppUser | null;
  initializing: boolean;
  error: unknown | null;
  initAuthListener: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

let unsubscribe: Unsubscribe | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  error: null,
  initAuthListener: () => {
    if (unsubscribe) return; // idempotent
    unsubscribe = subscribeToAuth(
      (user) => set({ user, initializing: false, error: null }),
      (error) => set({ error, initializing: false })
    );
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
}));

export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthStatus = () =>
  useAuthStore((s) => ({ initializing: s.initializing, error: s.error }));

import { useCallback } from 'react';
import { usePetsStore } from './pets.store.ts';
import { useAuthStore } from './auth.store.ts';
import { useUiStore } from '@store/ui.store.ts';

// Import other store hooks as needed

export function useResetStores() {
  return useCallback(() => {
    usePetsStore.getState().reset();
    useAuthStore.getState().reset();
    useUiStore.getState().reset();
    // Call reset on other stores...
  }, []);
}

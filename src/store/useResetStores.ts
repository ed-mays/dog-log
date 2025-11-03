import { useCallback } from 'react';
import { usePetsStore } from './pets.store.ts';
import { useUiStore } from '@store/ui.store.ts';

// Import other store hooks as needed

export function useResetStores() {
  return useCallback(() => {
    // Note: Do NOT reset the auth store here.
    // The auth listener remains active across logouts and will set user=null.
    // Resetting auth to its initial state inadvertently sets initializing=true,
    // which can stall the UI on the welcome route behind a loading indicator.
    usePetsStore.getState().reset();
    useUiStore.getState().reset();
    // Call reset on other stores as needed...
  }, []);
}

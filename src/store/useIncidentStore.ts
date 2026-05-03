import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { incidentService } from '@services/incidentService';
import { useAuthStore } from '@store/auth.store';
import type { Incident } from '@features/incidents/types';

// Per design §D8 NFR-2: startIncident generates the UUID and startedAt
// synchronously, sets activeIncident, then persists in the background.
// The timer can read startedAt before the Firestore write resolves.

export interface IncidentState {
  activeIncident: Incident | null;
  isLoading: boolean;
  error: string | null;
  startIncident: (args: { petId: string }) => Promise<void>;
  stopIncident: () => Promise<void>;
  hydrateActiveIncident: () => Promise<void>;
}

function buildOptimisticIncident(
  id: string,
  userId: string,
  petId: string,
  startedAt: Date
): Incident {
  return {
    id,
    userId,
    createdBy: userId,
    petId,
    startedAt,
    endedAt: null,
    type: null,
    severity: null,
    chips: [],
    journal: [],
    deletedAt: null,
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

export const useIncidentStore = create(
  devtools<IncidentState>((set, get) => ({
    activeIncident: null,
    isLoading: false,
    error: null,

    startIncident: async ({ petId }) => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      const id = crypto.randomUUID();
      const startedAt = new Date();

      set({
        activeIncident: buildOptimisticIncident(id, userId, petId, startedAt),
        error: null,
      });

      try {
        await incidentService.createIncident({
          id,
          userId,
          petId,
          startedAt,
        });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Failed to start incident',
        });
      }
    },

    stopIncident: async () => {
      const active = get().activeIncident;
      const userId = useAuthStore.getState().user?.uid;
      if (!active || !userId) return;

      const endedAt = new Date();
      set({ activeIncident: null, error: null });

      try {
        await incidentService.stopIncident({
          userId,
          incidentId: active.id,
          endedAt,
        });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Failed to stop incident',
        });
      }
    },

    hydrateActiveIncident: async () => {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) return;

      try {
        const active = await incidentService.findActiveIncident(userId);
        set({ activeIncident: active });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to hydrate incident',
        });
      }
    },
  }))
);

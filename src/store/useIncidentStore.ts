import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { incidentService } from '@services/incidentService';
import { useAuthStore } from '@store/auth.store';
import type { Incident, Severity } from '@features/incidents/types';

// Per design §D8 NFR-2: startIncident generates the UUID and startedAt
// synchronously, sets activeIncident, then persists in the background.
// The timer can read startedAt before the Firestore write resolves.
//
// Per §D2 post-STOP store invariant (BR-14, BR-25, round-31 amend_design):
// stopIncident() sets endedAt on activeIncident rather than nulling it.
// activeIncident clears to null only on startIncident(), explicit user
// dismissal from the stopped surface, or auth sign-out. This keeps the
// surface open after STOP per BR-14 and unifies live + post-stop phases
// per BR-25.

export interface IncidentState {
  activeIncident: Incident | null;
  isLoading: boolean;
  error: string | null;
  startIncident: (args: { petId: string }) => Promise<void>;
  stopIncident: () => Promise<void>;
  hydrateActiveIncident: () => Promise<void>;
  // BR-6: severity is settable, changeable, clearable by single-tap chip interaction.
  // Paired chore added in T-21 — service methods existed; store surface was missing.
  setSeverity: (severity: Severity) => Promise<void>;
  clearSeverity: () => Promise<void>;
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
      // §D2 post-STOP invariant: keep activeIncident populated with endedAt
      // set, so ActiveIncidentPage stays open after STOP per BR-14.
      set({
        activeIncident: { ...active, endedAt },
        error: null,
      });

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

    setSeverity: async (severity) => {
      const active = get().activeIncident;
      const userId = useAuthStore.getState().user?.uid;
      if (!active || !userId) return;

      set({ activeIncident: { ...active, severity }, error: null });

      try {
        await incidentService.setSeverity(userId, active.id, severity);
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Failed to set severity',
        });
      }
    },

    clearSeverity: async () => {
      const active = get().activeIncident;
      const userId = useAuthStore.getState().user?.uid;
      if (!active || !userId) return;

      set({ activeIncident: { ...active, severity: null }, error: null });

      try {
        await incidentService.clearSeverity(userId, active.id);
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Failed to clear severity',
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

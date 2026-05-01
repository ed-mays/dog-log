import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { petVetService } from '@services/petVetService';
import type { PetVetLink, Vet, VetId, PetVetRole } from '@models/vets';

export interface PetVetsEntry {
  links: Array<{ link: PetVetLink; vet: Vet }>;
  loading: boolean;
  error: string | null;
}

export interface PetVetsState {
  /** Keyed by petId so multiple PetCards / pages share the cache. */
  byPetId: Record<string, PetVetsEntry>;
  /**
   * In-flight petId set, used to dedupe concurrent fetches when a list of
   * PetCards mounts and each calls `fetchPetVets(petId)` for the same id.
   */
  _inFlight: Set<string>;

  fetchPetVets: (userId: string, petId: string) => Promise<void>;
  /** Forces a refetch even if already cached. Used after structural changes. */
  refreshPetVets: (userId: string, petId: string) => Promise<void>;
  linkVet: (
    userId: string,
    petId: string,
    vetId: VetId,
    vet: Vet,
    role?: PetVetRole,
    notes?: string
  ) => Promise<void>;
  unlinkVet: (userId: string, petId: string, linkId: string) => Promise<void>;
  setPrimaryVet: (
    userId: string,
    petId: string,
    linkId: string
  ) => Promise<void>;
  updateLinkRole: (
    userId: string,
    petId: string,
    linkId: string,
    role: PetVetRole
  ) => Promise<void>;
}

const emptyEntry: PetVetsEntry = { links: [], loading: false, error: null };

export const usePetVetsStore = create(
  devtools<PetVetsState>((set, get) => ({
    byPetId: {},
    _inFlight: new Set<string>(),

    fetchPetVets: async (userId, petId) => {
      // Dedupe: if already loading this petId, skip.
      if (get()._inFlight.has(petId)) return;

      set((state) => ({
        _inFlight: new Set(state._inFlight).add(petId),
        byPetId: {
          ...state.byPetId,
          [petId]: {
            ...(state.byPetId[petId] ?? emptyEntry),
            loading: true,
            error: null,
          },
        },
      }));

      try {
        const links = await petVetService.getPetVets(userId, petId);
        set((state) => {
          const next = new Set(state._inFlight);
          next.delete(petId);
          return {
            _inFlight: next,
            byPetId: {
              ...state.byPetId,
              [petId]: { links, loading: false, error: null },
            },
          };
        });
      } catch (error) {
        set((state) => {
          const next = new Set(state._inFlight);
          next.delete(petId);
          return {
            _inFlight: next,
            byPetId: {
              ...state.byPetId,
              [petId]: {
                links: state.byPetId[petId]?.links ?? [],
                loading: false,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Failed to load pet vets',
              },
            },
          };
        });
      }
    },

    refreshPetVets: async (userId, petId) => {
      // Drop dedup flag so fetch runs even if a stale flag is set.
      set((state) => {
        const next = new Set(state._inFlight);
        next.delete(petId);
        return { _inFlight: next };
      });
      return get().fetchPetVets(userId, petId);
    },

    linkVet: async (userId, petId, vetId, vet, role, notes) => {
      const link = await petVetService.linkVetToPet(
        userId,
        petId,
        vetId,
        role,
        notes
      );
      set((state) => {
        const entry = state.byPetId[petId] ?? emptyEntry;
        return {
          byPetId: {
            ...state.byPetId,
            [petId]: {
              ...entry,
              links: [...entry.links, { link, vet }],
            },
          },
        };
      });
    },

    unlinkVet: async (userId, petId, linkId) => {
      await petVetService.unlinkVetFromPet(userId, linkId);
      set((state) => {
        const entry = state.byPetId[petId];
        if (!entry) return state;
        return {
          byPetId: {
            ...state.byPetId,
            [petId]: {
              ...entry,
              links: entry.links.filter((l) => l.link.id !== linkId),
            },
          },
        };
      });
    },

    setPrimaryVet: async (userId, petId, linkId) => {
      // Optimistic: promote the target to primary, demote any current primary
      // to its previousNonPrimaryRole (or 'other' as a fallback).
      set((state) => {
        const entry = state.byPetId[petId];
        if (!entry) return state;
        return {
          byPetId: {
            ...state.byPetId,
            [petId]: {
              ...entry,
              links: entry.links.map((l) => {
                if (l.link.id === linkId) {
                  return { ...l, link: { ...l.link, role: 'primary' } };
                }
                if (l.link.role === 'primary') {
                  return {
                    ...l,
                    link: {
                      ...l.link,
                      role: l.link.previousNonPrimaryRole ?? 'other',
                    },
                  };
                }
                return l;
              }),
            },
          },
        };
      });

      try {
        await petVetService.setPrimaryVet(userId, petId, linkId);
      } catch (error) {
        // Revert by refetching truth.
        await get().refreshPetVets(userId, petId);
        throw error;
      }
    },

    updateLinkRole: async (userId, petId, linkId, role) => {
      // Optimistic update.
      set((state) => {
        const entry = state.byPetId[petId];
        if (!entry) return state;
        return {
          byPetId: {
            ...state.byPetId,
            [petId]: {
              ...entry,
              links: entry.links.map((l) =>
                l.link.id === linkId ? { ...l, link: { ...l.link, role } } : l
              ),
            },
          },
        };
      });

      try {
        await petVetService.updateLink(userId, linkId, { role });
      } catch (error) {
        await get().refreshPetVets(userId, petId);
        throw error;
      }
    },
  }))
);

import { useEffect, useMemo } from 'react';
import { usePetVetsStore } from '@store/petVets.store';
import type { PetVetLink, Vet, VetId, PetVetRole } from '@models/vets';

interface UsePetVetsResult {
  links: Array<{ link: PetVetLink; vet: Vet }>;
  loading: boolean;
  error: string | null;
  /** Forces a refetch — bypasses dedupe. */
  refresh: () => Promise<void>;
  linkVet: (
    vetId: VetId,
    vet: Vet,
    role?: PetVetRole,
    notes?: string
  ) => Promise<void>;
  unlinkVet: (linkId: string) => Promise<void>;
  setPrimaryVet: (linkId: string) => Promise<void>;
  updateLinkRole: (linkId: string, role: PetVetRole) => Promise<void>;
}

/**
 * Subscribes to the keyed pet-vet cache for `(userId, petId)`.
 * Mounts trigger a fetch (deduped at the store layer so a list of PetCards
 * for the same petId only hits the network once).
 *
 * Pass `enabled: false` to suppress the auto-fetch (e.g. when feature flags
 * are off or the petId is not yet known).
 */
export function usePetVets(
  userId: string | undefined,
  petId: string | undefined,
  options: { enabled?: boolean } = {}
): UsePetVetsResult {
  const { enabled = true } = options;

  const entry = usePetVetsStore((s) => (petId ? s.byPetId[petId] : undefined));
  const fetchPetVets = usePetVetsStore((s) => s.fetchPetVets);
  const refreshPetVets = usePetVetsStore((s) => s.refreshPetVets);
  const storeLinkVet = usePetVetsStore((s) => s.linkVet);
  const storeUnlinkVet = usePetVetsStore((s) => s.unlinkVet);
  const storeSetPrimaryVet = usePetVetsStore((s) => s.setPrimaryVet);
  const storeUpdateLinkRole = usePetVetsStore((s) => s.updateLinkRole);

  useEffect(() => {
    if (!enabled || !userId || !petId) return;
    fetchPetVets(userId, petId);
  }, [enabled, userId, petId, fetchPetVets]);

  return useMemo<UsePetVetsResult>(
    () => ({
      links: entry?.links ?? [],
      loading: entry?.loading ?? false,
      error: entry?.error ?? null,
      refresh: async () => {
        if (!userId || !petId) return;
        await refreshPetVets(userId, petId);
      },
      linkVet: async (vetId, vet, role, notes) => {
        if (!userId || !petId) return;
        await storeLinkVet(userId, petId, vetId, vet, role, notes);
      },
      unlinkVet: async (linkId) => {
        if (!userId || !petId) return;
        await storeUnlinkVet(userId, petId, linkId);
      },
      setPrimaryVet: async (linkId) => {
        if (!userId || !petId) return;
        await storeSetPrimaryVet(userId, petId, linkId);
      },
      updateLinkRole: async (linkId, role) => {
        if (!userId || !petId) return;
        await storeUpdateLinkRole(userId, petId, linkId, role);
      },
    }),
    [
      entry,
      userId,
      petId,
      refreshPetVets,
      storeLinkVet,
      storeUnlinkVet,
      storeSetPrimaryVet,
      storeUpdateLinkRole,
    ]
  );
}

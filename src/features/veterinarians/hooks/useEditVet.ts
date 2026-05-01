import { useCallback, useEffect, useState } from 'react';
import { vetService, type UpdateVetInput } from '@services/vetService';
import type { Vet, VetId } from '@models/vets';

export interface UseEditVetResult {
  vet: Vet | null;
  loading: boolean;
  loadError: unknown;
  updateVet: (patch: UpdateVetInput) => Promise<Vet>;
  updating: boolean;
  updateError: unknown;
}

/**
 * Loads a vet by id on mount and exposes an `updateVet` mutator.
 * Load errors set `loadError` and surface `vet === null`.
 */
export function useEditVet(
  userId: string | undefined,
  id: VetId
): UseEditVetResult {
  const [vet, setVet] = useState<Vet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);

  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<unknown>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const v = await vetService.getVet(userId, id);
        if (mounted) setVet(v);
      } catch (err) {
        if (mounted) {
          setVet(null);
          setLoadError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId, id]);

  const updateVet = useCallback(
    async (patch: UpdateVetInput): Promise<Vet> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      setUpdating(true);
      setUpdateError(null);
      try {
        const next = await vetService.updateVet(userId, id, patch);
        setVet(next);
        return next;
      } catch (err) {
        setUpdateError(err);
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [userId, id]
  );

  return { vet, loading, loadError, updateVet, updating, updateError };
}

import { useCallback, useState } from 'react';
import { vetService, type CreateVetInput } from '@services/vetService';
import type { Vet } from '@models/vets';

interface UseCreateVetResult {
  createVet: (input: CreateVetInput) => Promise<Vet>;
  loading: boolean;
  error: unknown;
}

/**
 * Wraps `vetService.createVet`. Caller is expected to handle navigation /
 * UI feedback via the returned promise and `error` state.
 *
 * `userId` is the namespace owner; `ownerUserId` is the vet's owner — the
 * service distinguishes these for shared-vet scenarios. Most callers pass
 * the same value for both.
 */
export function useCreateVet(
  userId: string | undefined,
  ownerUserId: string | undefined
): UseCreateVetResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const createVet = useCallback(
    async (input: CreateVetInput): Promise<Vet> => {
      if (!userId || !ownerUserId) {
        throw new Error('User not authenticated');
      }
      setLoading(true);
      setError(null);
      try {
        return await vetService.createVet(userId, ownerUserId, input);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId, ownerUserId]
  );

  return { createVet, loading, error };
}

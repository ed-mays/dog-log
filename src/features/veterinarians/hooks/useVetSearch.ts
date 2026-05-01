import { useEffect, useState } from 'react';
import { vetService } from '@services/vetService';
import type { Vet } from '@models/vets';

export interface UseVetSearchOptions {
  /** Debounce window in ms before refetching when `term` changes. 0 disables debounce. */
  debounceMs?: number;
}

export interface UseVetSearchResult {
  vets: Vet[];
  loading: boolean;
}

/**
 * Subscribes to vet search results for the current user.
 * Refetches when `term` changes (optionally debounced).
 * Errors are swallowed and surface as an empty list — matches existing UX in
 * VetListPage / VetSelector where Firestore permission denials show empty state.
 */
export function useVetSearch(
  userId: string | undefined,
  term: string,
  options: UseVetSearchOptions = {}
): UseVetSearchResult {
  const { debounceMs = 0 } = options;
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setVets([]);
      return;
    }

    let active = true;

    const run = async () => {
      if (!active) return;
      setLoading(true);
      try {
        const list = await vetService.searchVets(userId, term);
        if (active) setVets(list);
      } catch {
        if (active) setVets([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (debounceMs > 0) {
      const handle = setTimeout(run, debounceMs);
      return () => {
        active = false;
        clearTimeout(handle);
      };
    }

    run();
    return () => {
      active = false;
    };
  }, [userId, term, debounceMs]);

  return { vets, loading };
}

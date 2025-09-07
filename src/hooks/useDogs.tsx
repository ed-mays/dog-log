import { useEffect } from 'react';
import { useDogsStore } from '@store/dogs.store';

export function useDogs() {
  const dogs = useDogsStore((state) => state.dogs);
  const loading = useDogsStore((state) => state.loading);
  const error = useDogsStore((state) => state.error);
  const fetchDogs = useDogsStore((state) => state.fetchDogs);

  useEffect(() => {
    // Fetches only once per component mount; configure for your needs
    fetchDogs();
  }, [fetchDogs]);

  return { dogs, loading, error };
}

import { useEffect } from 'react';
import { usePetsStore } from '@store/pets.store';
import { useUiStore } from '@store/ui.store';

export function usePets() {
  const pets = usePetsStore((state) => state.pets);
  const loading = useUiStore((state) => state.loading);
  const error = useUiStore((state) => state.error);
  const fetchPets = usePetsStore((state) => state.fetchPets);

  useEffect(() => {
    // Fetches only once per component mount; configure for your needs
    fetchPets();
  }, [fetchPets]);

  return { pets: pets, loading, error };
}

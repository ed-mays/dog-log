import React from 'react';
import { useLocation } from 'react-router-dom';
import { usePetsStore } from '@store/pets.store';
import { useUiStore } from '@store/ui.store';

export function RoutePrefetcher() {
  const location = useLocation();
  const pets = usePetsStore((s) => s.pets);
  const fetchPets = usePetsStore((s) => s.fetchPets);
  const loading = useUiStore((s) => s.loading);

  React.useEffect(() => {
    const onPetsRoute = location.pathname.startsWith('/pets');
    if (onPetsRoute && pets.length === 0 && !loading) {
      void fetchPets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, pets.length, fetchPets]);

  return null;
}

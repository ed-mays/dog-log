import React from 'react';
import { useLocation } from 'react-router-dom';
import { usePetsStore } from '@store/pets.store';
import { useUiStore } from '@store/ui.store';
import { shallow } from 'zustand/shallow';

export function RoutePrefetcher() {
  const location = useLocation();
  const { petsLen, fetchPets } = usePetsStore(
    (s) => ({
      petsLen: s.pets.length,
      fetchPets: s.fetchPets,
    }),
    shallow
  );
  const loading = useUiStore((s) => s.loading);

  React.useEffect(() => {
    // console.debug('[RoutePrefetcher] effect', { path: location.pathname, petsLen, loading });
    const onPetsRoute = location.pathname.startsWith('/pets');
    if (onPetsRoute && petsLen === 0 && !loading) {
      void fetchPets();
    }
  }, [location.pathname, petsLen, loading, fetchPets]);

  return null;
}

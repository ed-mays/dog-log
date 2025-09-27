import React from 'react';
import { useLocation } from 'react-router-dom';
import { usePetsStore } from '@store/pets.store';

export function RoutePrefetcher() {
  const location = useLocation();
  // Select primitives separately to avoid creating new objects per render
  const petsLen = usePetsStore((s) => s.pets.length);
  const loading = usePetsStore((s) => s.loading);
  const fetchPets = usePetsStore((s) => s.fetchPets);

  React.useEffect(() => {
    // console.debug('[RoutePrefetcher] effect', { path: location.pathname, petsLen, loading });
    const onPetsRoute = location.pathname.startsWith('/pets');
    if (onPetsRoute && petsLen === 0 && !loading) {
      void fetchPets();
    }
  }, [location.pathname, petsLen, loading, fetchPets]);

  return null;
}

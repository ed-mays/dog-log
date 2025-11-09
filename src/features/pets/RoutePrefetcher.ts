import React from 'react';
import { useLocation } from 'react-router-dom';
import { usePetsStore } from '@store/pets.store';
import { useAuthStore } from '@store/auth.store';

export function RoutePrefetcher() {
  const location = useLocation();
  const pets = usePetsStore((s) => s.pets);
  const fetchPets = usePetsStore((s) => s.fetchPets);
  const { user, initializing } = useAuthStore();

  React.useEffect(() => {
    const onPetsRoute = location.pathname.startsWith('/pets');
    if (onPetsRoute && !initializing && user && pets.length === 0) {
      void fetchPets();
    }
  }, [location.pathname, pets.length, fetchPets, user, initializing]);

  return null;
}

import { PetList } from './PetList.tsx';
import React from 'react';
import { usePetsStore } from '@store/pets.store.tsx';

export default function PetListPage() {
  const pets = usePetsStore((state) => state.pets);

  const fetchPets = usePetsStore.getState().fetchPets;
  React.useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return (
    <div>
      <PetList pets={pets} /* pets, etc. */ />
    </div>
  );
}

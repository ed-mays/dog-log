import './App.css';
import { useFeatureFlag } from './featureFlags/useFeatureFlag.tsx';
import { PetList } from './features/petManagement/PetList.tsx';
import { usePetsStore } from '@store/pets.store.tsx';
import React from 'react';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator.tsx';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator.tsx';

function App() {
  const pets = usePetsStore((state) => state.pets);
  const loading = usePetsStore((state) => state.loading);
  const error = usePetsStore((state) => state.error);
  const fetchPets = usePetsStore((state) => state.fetchPets);
  const enablePetList = useFeatureFlag('pet_list_enabled');

  React.useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  if (loading) return <LoadingIndicator />;
  else if (error) return <ErrorIndicator />;
  else if (enablePetList && pets.length > 0)
    return <PetList pets={pets} data-testid="pet-list" />;
  return null;
}

export default App;

import './App.css';
import { useFeatureFlag } from './featureFlags/useFeatureFlag.tsx';
import { DogList } from '@components/DogList.tsx';
import { useDogsStore } from '@store/dogs.store.tsx';
import React from 'react';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator.tsx';

function App() {
  const dogs = useDogsStore((state) => state.dogs);
  const loading = useDogsStore((state) => state.loading);
  const error = useDogsStore((state) => state.error);
  const fetchDogs = useDogsStore((state) => state.fetchDogs);
  const enableDogList = useFeatureFlag('dog_list_enabled');

  React.useEffect(() => {
    fetchDogs();
  }, [fetchDogs]);

  if (loading) return <LoadingIndicator />;
  else if (error) return <div data-testid="error-indicator">{error}</div>;
  else if (enableDogList && dogs.length > 0)
    return <DogList dogs={dogs} data-testid="dog-list" />;
  return null;
}

export default App;

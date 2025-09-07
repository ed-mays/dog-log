import './App.css';
import { useFeatureFlag } from './featureFlags/useFeatureFlag.tsx';
import { DogList } from '@components/DogList.tsx';
import { useDogsStore } from '@store/dogs.store.tsx';
import React from 'react';

function App() {
  const dogs = useDogsStore((state) => state.dogs);
  const loading = useDogsStore((state) => state.loading);
  const error = useDogsStore((state) => state.error);
  const fetchDogs = useDogsStore((state) => state.fetchDogs);
  const enableDogList = useFeatureFlag('dog_list_enabled');
  //const appTitle = import.meta.env.VITE_APP_TITLE;

  React.useEffect(() => {
    fetchDogs();
  }, [fetchDogs]);

  if (loading) return <div data-testid="loading-indicator">Loading…</div>;
  if (error) return <div data-testid="error-indicator">{error}</div>;
  if (enableDogList && dogs.length > 0)
    return <DogList dogs={dogs} data-testid="dog-list" />;
  return null;
}

export default App;

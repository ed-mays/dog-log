import './App.css';
import React from 'react';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { usePetsStore } from '@store/pets.store';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import PetListPage from './features/petManagement/petListPage';
import AddPetPage from '@features/petManagement/AddPetPage';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from './utils/errors';

function RoutePrefetcher() {
  const location = useLocation();
  const pets = usePetsStore((s) => s.pets);
  const loading = usePetsStore((s) => s.loading);
  const fetchPets = usePetsStore((s) => s.fetchPets);

  React.useEffect(() => {
    const onPetsRoute = location.pathname.startsWith('/pets');
    if (onPetsRoute && pets.length === 0 && !loading) {
      void fetchPets();
    }
  }, [location.pathname, pets.length, loading, fetchPets]);

  return null;
}

function App() {
  const loading = usePetsStore((state) => state.loading);
  const error = usePetsStore((state) => state.error);

  const enablePetList = useFeatureFlag('petListEnabled');
  const { t } = useTranslation('common');

  const errorTextBase = t('error', 'Error...');
  const errorDetail = toErrorMessage(error);
  const errorText = errorDetail
    ? `${errorTextBase} ${String(errorDetail)}`
    : errorTextBase;
  return (
    <BrowserRouter>
      <RoutePrefetcher />
      {loading && <LoadingIndicator />}
      {errorDetail && <ErrorIndicator text={errorText} />}
      <Routes>
        <Route
          path="/pets"
          element={
            enablePetList ? (
              <PetListPage />
            ) : (
              <Navigate to="/feature-unavailable" replace />
            )
          }
        />
        <Route path="/pets/new" element={<AddPetPage />} />
        <Route path="*" element={<Navigate to="/pets" />} />
        <Route
          path="/feature-unavailable"
          element={<div>{t('featureNotEnabled', 'Feature not enabled')}</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

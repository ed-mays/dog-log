import './App.css';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { usePetsStore } from '@store/pets.store';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PetListPage from './features/petManagement/petListPage';
import AddPetPage from '@features/petManagement/AddPetPage';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from './utils/errors';

function App() {
  const loading = usePetsStore((state) => state.loading);
  const error = usePetsStore((state) => state.error);

  const enablePetList = useFeatureFlag('petListEnabled');
  const { t } = useTranslation('common');

  const errorTextBase = t('error', 'Error...');
  const errorDetail = toErrorMessage(error);
  const errorText = errorDetail
    ? `${errorTextBase}: ${errorDetail}`
    : errorTextBase;

  return (
    <BrowserRouter>
      {loading && <LoadingIndicator />}
      {error && <ErrorIndicator text={errorText} />}
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

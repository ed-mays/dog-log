import './App.css';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { usePetsStore } from '@store/pets.store';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PetListPage from './features/petManagement/petListPage';
import AddPetPage from '@features/petManagement/AddPetPage';

function App() {
  const loading = usePetsStore((state) => state.loading);
  const error = usePetsStore((state) => state.error);

  const enablePetList = useFeatureFlag('petListEnabled');

  return (
    <BrowserRouter>
      {loading && <LoadingIndicator />}
      {error && <ErrorIndicator />}
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
          element={<div>Feature not enabled</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

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
import WelcomePage from '@features/authentication/WelcomePage';
import { useAuthStore } from '@store/auth.store';
import LogoutButton from '@components/common/Auth/LogoutButton';
import { useAuthUser } from '@store/auth.store';

function RoutePrefetcher() {
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

function PrivateRoute({ children }: { children: React.ReactElement }) {
  // Select primitives to avoid returning a new object on each render
  const initializing = useAuthStore((s) => s.initializing);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const authEnabled = useFeatureFlag('authEnabled');
  if (!authEnabled) {
    return <Navigate to="/welcome" replace />;
  }
  if (initializing) {
    return <LoadingIndicator />;
  }
  if (!user) {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }
  return children;
}

function App() {
  const appLoading = usePetsStore((state) => state.loading);
  const appError = usePetsStore((state) => state.error);

  const enablePetList = useFeatureFlag('petListEnabled');
  const authEnabled = useFeatureFlag('authEnabled');
  const { t } = useTranslation('common');
  const user = useAuthUser();

  const errorTextBase = t('error', 'Error...');
  const errorDetail = toErrorMessage(appError);
  const errorText = errorDetail
    ? `${errorTextBase} ${String(errorDetail)}`
    : errorTextBase;
  return (
    <BrowserRouter>
      <RoutePrefetcher />
      {user && authEnabled && (
        <header aria-label="user-controls">
          <LogoutButton />
        </header>
      )}
      {appLoading && <LoadingIndicator />}
      {errorDetail && <ErrorIndicator text={errorText} />}
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route
          path="/pets"
          element={
            enablePetList ? (
              <PrivateRoute>
                <PetListPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/feature-unavailable" replace />
            )
          }
        />
        <Route
          path="/pets/new"
          element={
            <PrivateRoute>
              <AddPetPage />
            </PrivateRoute>
          }
        />
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

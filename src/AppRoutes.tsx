// src/AppRoutes.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.ts';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store.ts';
import { WelcomePage } from '@features/authentication/pages/WelcomePage.tsx';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator.tsx';
import { NotFoundPage } from '@features/misc/pages/NotFoundPage.tsx';
import { useIsAuthenticated } from '@features/authentication/hooks/useIsAuthenticated';
import { Alert } from '@mui/material';

const PetListPage = lazy(() => import('@features/pets/pages/petListPage.tsx'));
const AddPetPage = lazy(() => import('@features/pets/pages/AddPetPage.tsx'));
const EditPetPage = lazy(() => import('@features/pets/pages/EditPetPage.tsx'));

export function AppRoutes() {
  const enablePetList = useFeatureFlag('petListEnabled');
  const enableAddPet = useFeatureFlag('addPetEnabled');
  const enablePetActions = useFeatureFlag('petActionsEnabled');
  const { t } = useTranslation('common');
  const { initializing } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();

  if (initializing) {
    return <LoadingIndicator />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/pets/*" element={<Navigate to="/welcome" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    );
  }

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Routes>
        <Route path="/" element={<Navigate to="/pets" replace />} />
        <Route path="/welcome" element={<Navigate to="/pets" replace />} />
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
        <Route
          path="/pets/new"
          element={
            enableAddPet ? (
              <AddPetPage />
            ) : (
              <Navigate to="/feature-unavailable" replace />
            )
          }
        />
        <Route
          path="/pets/:id/edit"
          element={
            enablePetActions ? (
              <EditPetPage />
            ) : (
              <Navigate to="/feature-unavailable" replace />
            )
          }
        />
        <Route
          path="/feature-unavailable"
          element={
            <Alert severity="warning" role="alert">
              {t('featureNotEnabled', 'Feature not enabled')}
            </Alert>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

// src/AppRoutes.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';
import { WelcomePage } from '@features/authentication/pages/WelcomePage';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { NotFoundPage } from '@features/misc/pages/NotFoundPage';
import { useIsAuthenticated } from '@features/authentication/hooks/useIsAuthenticated';
import { Alert } from '@mui/material';

const PetListPage = lazy(() => import('@features/pets/pages/petListPage'));
const AddPetPage = lazy(() => import('@features/pets/pages/AddPetPage'));
const EditPetPage = lazy(() => import('@features/pets/pages/EditPetPage'));
const PetDetailsPage = lazy(
  () => import('@features/pets/pages/PetDetailsPage')
);

// Veterinarian feature pages (slice 0 scaffolds)
const VetListPage = lazy(
  () => import('@features/veterinarians/pages/VetListPage')
);
const AddVetPage = lazy(
  () => import('@features/veterinarians/pages/AddVetPage')
);
const EditVetPage = lazy(
  () => import('@features/veterinarians/pages/EditVetPage')
);

export function AppRoutes() {
  const enablePetList = useFeatureFlag('petListEnabled');
  const enableAddPet = useFeatureFlag('addPetEnabled');
  const enablePetActions = useFeatureFlag('petActionsEnabled');
  const { t } = useTranslation('common');
  const { initializing } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const enableVets = useFeatureFlag('vetsEnabled');

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
        {/* Pets routes */}
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
          path="/pets/:id"
          element={
            enablePetList ? (
              <PetDetailsPage />
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
        {/* Veterinarians routes (flag-gated) */}
        <Route
          path="/vets"
          element={
            enableVets ? (
              <VetListPage />
            ) : (
              <Navigate to="/feature-unavailable" replace />
            )
          }
        />
        <Route
          path="/vets/add"
          element={
            enableVets ? (
              <AddVetPage />
            ) : (
              <Navigate to="/feature-unavailable" replace />
            )
          }
        />
        <Route
          path="/vets/:id/edit"
          element={
            enableVets ? (
              <EditVetPage />
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

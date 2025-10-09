// src/AppRoutes.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { PrivateRoute } from '@components/common/PrivateRoute';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';
import { WelcomePage } from '@features/authentication/WelcomePage.tsx';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator.tsx';

const PetListPage = lazy(() => import('@features/petManagement/petListPage'));
const AddPetPage = lazy(() => import('@features/petManagement/AddPetPage'));

export function AppRoutes() {
  const enablePetList = useFeatureFlag('petListEnabled');
  const { t } = useTranslation('common');
  const { user } = useAuthStore();

  if (!user) {
    return (
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="*" element={<Navigate to="/welcome" />} />
      </Routes>
    );
  }

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Routes>
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
        <Route
          path="/feature-unavailable"
          element={<div>{t('featureNotEnabled', 'Feature not enabled')}</div>}
        />
        <Route path="*" element={<Navigate to="/pets" />} />
      </Routes>
    </Suspense>
  );
}

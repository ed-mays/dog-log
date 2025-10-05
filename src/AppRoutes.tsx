import { Navigate, Route, Routes } from 'react-router-dom';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { PrivateRoute } from '@components/common/PrivateRoute';
import PetListPage from './features/petManagement/petListPage';
import AddPetPage from '@features/petManagement/AddPetPage';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';
import { WelcomePage } from './features/authentication/WelcomePage';

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
      <Route path="*" element={<Navigate to="/pets" />} />
      <Route
        path="/feature-unavailable"
        element={<div>{t('featureNotEnabled', 'Feature not enabled')}</div>}
      />
    </Routes>
  );
}

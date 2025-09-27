import './App.css';
import React from 'react';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { usePetsStore } from '@store/pets.store';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { BrowserRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from './utils/errors';
import LogoutButton from '@components/common/Auth/LogoutButton';
import { useAuthUser } from '@store/auth.store';
import { RoutePrefetcher } from './features/petManagement/RoutePrefetcher';
import { AppRoutes } from './AppRoutes';

function App() {
  const appLoading = usePetsStore((state) => state.loading);
  const appError = usePetsStore((state) => state.error);

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
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

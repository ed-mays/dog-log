import './App.css';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { useUiStore } from '@store/ui.store';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from './utils/errors';
import LogoutButton from '@components/common/Auth/LogoutButton';
import LoginButton from '@components/common/Auth/LoginButton';
import { useAuthStore } from '@store/auth.store';
import { RoutePrefetcher } from './features/petManagement/RoutePrefetcher';
import { AppRoutes } from './AppRoutes';

function App() {
  const appLoading = useUiStore((state) => state.loading);
  const appError = useUiStore((state) => state.error);
  const { user, initializing } = useAuthStore();

  const authEnabled = useFeatureFlag('authEnabled');
  const { t } = useTranslation('common');

  const errorTextBase = t('error', 'Error...');
  const errorDetail = toErrorMessage(appError);
  const errorText = errorDetail
    ? `${errorTextBase} ${String(errorDetail)}`
    : errorTextBase;

  if (initializing && authEnabled) {
    return <LoadingIndicator />;
  }

  if (!user && authEnabled) {
    return (
      <div className="welcome-container">
        <h1>{t('welcome.title', 'Welcome to Dog Log!')}</h1>
        <p>{t('welcome.message', 'Please sign in to continue.')}</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <>
      <RoutePrefetcher />
      {user && authEnabled && (
        <header aria-label="user-controls">
          <LogoutButton />
        </header>
      )}
      {appLoading && <LoadingIndicator />}
      {errorDetail && <ErrorIndicator text={errorText} />}
      <AppRoutes />
    </>
  );
}

export default App;

import './App.css';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.tsx';
import { useUiStore } from '@store/ui.store';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from './utils/errors';
import LogoutButton from '@features/authentication/components/LogoutButton.tsx';
import { useAuthStore } from '@store/auth.store';
import { RoutePrefetcher } from '@features/petManagement/RoutePrefetcher';
import { AppRoutes } from './AppRoutes';
import { NavigationBar } from '@components/common/NavigationBar/NavigationBar.tsx';

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

  return (
    <div className="h-full">
      <RoutePrefetcher />
      {user && authEnabled && (
        <header aria-label="user-controls">
          <NavigationBar />
          <LogoutButton />
        </header>
      )}
      {appLoading && initializing && <LoadingIndicator />}
      {errorDetail && <ErrorIndicator text={errorText} />}
      <AppRoutes />
    </div>
  );
}

export default App;

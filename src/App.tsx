import './App.css';
import { useFeatureFlag } from './featureFlags/useFeatureFlag';
import { useUiStore } from '@store/ui.store';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from './utils/errors';
import LogoutButton from '@components/common/Auth/LogoutButton';
import { useAuthUser } from '@store/auth.store';
import { RoutePrefetcher } from './features/petManagement/RoutePrefetcher';
import { AppRoutes } from './AppRoutes';

function App() {
  const appLoading = useUiStore((state) => state.loading);
  const appError = useUiStore((state) => state.error);

  const authEnabled = useFeatureFlag('authEnabled');
  const { t } = useTranslation('common');
  const user = useAuthUser();

  const errorTextBase = t('error', 'Error...');
  const errorDetail = toErrorMessage(appError);
  const errorText = errorDetail
    ? `${errorTextBase} ${String(errorDetail)}`
    : errorTextBase;
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

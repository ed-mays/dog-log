import './App.css';
import { useUiStore } from '@store/ui.store';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from '@utils/errors.ts';
import { useAuthStore } from '@store/auth.store.ts';
import { RoutePrefetcher } from '@features/pets/RoutePrefetcher.ts';
import { AppRoutes } from './AppRoutes';
import { NavigationBar } from '@components/common/NavigationBar/NavigationBar.tsx';
import { Toolbar } from '@mui/material';
import { useIsAuthenticated } from '@features/authentication/hooks/useIsAuthenticated';

function App() {
  const appLoading = useUiStore((state) => state.loading);
  const appError = useUiStore((state) => state.error);
  const { initializing } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();

  const { t } = useTranslation('common');

  const errorTextBase = t('error', 'Error...');
  const errorDetail = toErrorMessage(appError);
  const errorText = errorDetail
    ? `${errorTextBase} ${String(errorDetail)}`
    : errorTextBase;

  return (
    <div className="h-full">
      <RoutePrefetcher />
      {isAuthenticated && (
        <header aria-label="user-controls">
          <NavigationBar />
        </header>
      )}
      <Toolbar />
      {appLoading && !initializing && <LoadingIndicator />}
      {errorDetail && <ErrorIndicator text={errorText} />}
      <AppRoutes />
    </div>
  );
}

export default App;

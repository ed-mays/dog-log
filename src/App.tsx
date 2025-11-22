import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { RoutePrefetcher } from '@features/pets/RoutePrefetcher';
import { NavigationBar } from '@components/common/NavigationBar/NavigationBar';

import './App.css';
import { AppRoutes } from './AppRoutes';
import { useAppStatus } from './hooks/useAppStatus.ts';

import { Toolbar } from '@mui/material';

const App = () => {
  const { appLoading, initializing, isAuthenticated, appError, errorText } =
    useAppStatus();

  const isLoading = appLoading && !initializing;
  const showHeader = isAuthenticated;
  const hasError = appError !== null;

  return (
    <div className="h-full">
      <RoutePrefetcher />
      {showHeader && (
        <header aria-label="user-controls">
          <NavigationBar />
        </header>
      )}
      <Toolbar />
      {isLoading && <LoadingIndicator />}
      {hasError && <ErrorIndicator text={errorText} />}
      <AppRoutes />
    </div>
  );
};

export default App;

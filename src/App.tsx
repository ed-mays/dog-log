import { useEffect } from 'react';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';
import { RoutePrefetcher } from '@features/pets/RoutePrefetcher';
import { NavigationBar } from '@components/common/NavigationBar/NavigationBar';
import { FeatureFlagsDevTool } from '@featureFlags/components/FeatureFlagsDevTool';
import { EmergencyActivationFab } from '@components/common/EmergencyActivationFab';
import { ResumeIncidentBanner } from '@features/incidents/components/ResumeIncidentBanner';

import './App.css';
import { AppRoutes } from './AppRoutes';
import { useAppStatus } from './hooks/useAppStatus.ts';
import { useAuthStore } from '@store/auth.store';
import { useIncidentStore } from '@store/useIncidentStore';

import { Toolbar } from '@mui/material';

const App = () => {
  const { appLoading, initializing, isAuthenticated, appError, errorText } =
    useAppStatus();
  const user = useAuthStore((s) => s.user);
  const hydrateActiveIncident = useIncidentStore(
    (s) => s.hydrateActiveIncident
  );

  const isLoading = appLoading && !initializing;
  const showHeader = isAuthenticated;
  const hasError = appError !== null;

  // DQ-2: one-shot hydration on auth-success boot (covers page reload and fresh sign-in).
  useEffect(() => {
    if (user) {
      void hydrateActiveIncident();
    }
  }, [user, hydrateActiveIncident]);

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
      {isAuthenticated && <ResumeIncidentBanner />}
      <AppRoutes />
      <EmergencyActivationFab />
      {import.meta.env.DEV && <FeatureFlagsDevTool />}
    </div>
  );
};

export default App;

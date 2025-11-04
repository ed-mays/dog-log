import React from 'react';
import { useAuthStore } from '@store/auth.store.ts';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.ts';

/**
 * @deprecated PrivateRoute is no longer used by the application.
 * Auth gating is centralized in AppRoutes and header visibility uses useIsAuthenticated.
 * Consider removing this component and its tests in a future cleanup.
 */
export function PrivateRoute({ children }: { children: React.ReactElement }) {
  const authEnabled = useFeatureFlag('authEnabled');
  const user = useAuthStore((s) => s.user);

  if (!authEnabled || user) {
    return children;
  }

  return null;
}

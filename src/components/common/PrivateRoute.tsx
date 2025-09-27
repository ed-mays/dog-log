import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';

export function PrivateRoute({ children }: { children: React.ReactElement }) {
  // Select primitives to avoid returning a new object on each render
  const initializing = useAuthStore((s) => s.initializing);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const authEnabled = useFeatureFlag('authEnabled');
  if (!authEnabled) {
    return <Navigate to="/welcome" replace />;
  }
  if (initializing) {
    return <LoadingIndicator />;
  }
  if (!user) {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }
  return children;
}

import React from 'react';
import { useAuthStore } from '@store/auth.store';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';

export function PrivateRoute({ children }: { children: React.ReactElement }) {
  const authEnabled = useFeatureFlag('authEnabled');
  const user = useAuthStore((s) => s.user);

  if (!authEnabled || user) {
    return children;
  }

  return null;
}

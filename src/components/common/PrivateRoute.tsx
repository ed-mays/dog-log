import React from 'react';
import { useAuthStore } from '@store/auth.store.ts';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.tsx';

export function PrivateRoute({ children }: { children: React.ReactElement }) {
  const authEnabled = useFeatureFlag('authEnabled');
  const user = useAuthStore((s) => s.user);

  if (!authEnabled || user) {
    return children;
  }

  return null;
}

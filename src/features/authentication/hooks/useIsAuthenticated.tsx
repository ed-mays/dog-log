import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useAuthStore } from '@store/auth.store';

/**
 * Derived auth state used across the app to answer: "is the user allowed to proceed?"
 *
 * Rules:
 * - When auth is disabled via feature flags, treat the app as authenticated.
 * - When auth is enabled, require a signed-in user.
 */
export function useIsAuthenticated(): boolean {
  const authEnabled = useFeatureFlag('authEnabled');
  const user = useAuthStore((s) => s.user);
  return !authEnabled || !!user;
}

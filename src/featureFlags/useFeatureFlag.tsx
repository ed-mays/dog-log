import { useFeatureFlagsContext } from './useFeatureFlagsContext';
import type { FeatureFlag } from './featureFlags.types';

// Typed hook for easy access in components
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { flags } = useFeatureFlagsContext();
  return flags[flag];
}

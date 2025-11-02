import { useFeatureFlagsContext } from './useFeatureFlagsContext.ts';
import type { FeatureFlag } from '../types.ts';

// Typed hook for easy access in components
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { flags } = useFeatureFlagsContext();
  return flags[flag];
}

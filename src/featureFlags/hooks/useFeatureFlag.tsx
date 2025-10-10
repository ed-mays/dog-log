import { useFeatureFlagsContext } from './useFeatureFlagsContext.tsx';
import type { FeatureFlag } from '../types.tsx';

// Typed hook for easy access in components
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { flags } = useFeatureFlagsContext();
  return flags[flag];
}

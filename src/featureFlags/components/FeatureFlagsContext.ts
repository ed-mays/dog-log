import { createContext } from 'react';
import type { FeatureFlags } from '../types.ts';

export type FeatureFlagsContextType = {
  flags: FeatureFlags;
  overrides: Partial<FeatureFlags>;
  setFlag: (key: keyof FeatureFlags, value: boolean) => void;
  setOverride: (key: keyof FeatureFlags, value: boolean | undefined) => void;
  resetOverrides: () => void;
};

export const FeatureFlagsContext = createContext<
  FeatureFlagsContextType | undefined
>(undefined);

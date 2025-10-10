import { createContext } from 'react';
import type { FeatureFlags } from '../types.tsx';

export type FeatureFlagsContextType = {
  flags: FeatureFlags;
  setFlag: (key: keyof FeatureFlags, value: boolean) => void;
};

export const FeatureFlagsContext = createContext<
  FeatureFlagsContextType | undefined
>(undefined);

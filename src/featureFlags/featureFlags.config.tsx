import type { FeatureFlags } from './featureFlags.types';

export const defaultFeatureFlags: FeatureFlags = {
  newDashboard: import.meta.env.VITE_FLAG_NEW_DASHBOARD === 'true',
  betaFeature: localStorage.getItem('FLAG_BETA_FEATURE') === 'true',
};

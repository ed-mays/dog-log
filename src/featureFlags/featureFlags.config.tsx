import type { FeatureFlags } from './featureFlags.types';

export const defaultFeatureFlags: FeatureFlags = {
  newDashboard: import.meta.env.VITE_FLAG_NEW_DASHBOARD === 'true',
  betaFeature: import.meta.env.VITE_FLAG_BETA_FEATURE === 'true',
  test_show_count_button: import.meta.env.VITE_FLAG_COUNT_BUTTON === 'true',
  petListEnabled: import.meta.env.VITE_PET_LIST_ENABLED === 'true',
  addPetEnabled: import.meta.env.VITE_ADD_PET_ENABLED === 'true',
  authEnabled:
    String(import.meta.env.VITE_AUTH_ENABLED ?? 'true').toLowerCase() ===
    'true',
};

import type { FeatureFlags } from './types.tsx';

export const defaultFeatureFlags: FeatureFlags = {
  newDashboard: import.meta.env.VITE_FLAG_NEW_DASHBOARD === 'true',
  betaFeature: import.meta.env.VITE_FLAG_BETA_FEATURE === 'true',
  test_show_count_button: import.meta.env.VITE_FLAG_COUNT_BUTTON === 'true',
  petListEnabled: import.meta.env.VITE_PET_LIST_ENABLED === 'true',
  addPetEnabled: import.meta.env.VITE_ADD_PET_ENABLED === 'true',
  authEnabled: import.meta.env.VITE_AUTH_ENABLED === 'true',
  petActionsEnabled: import.meta.env.VITE_PET_ACTIONS_ENABLED === 'true',
};

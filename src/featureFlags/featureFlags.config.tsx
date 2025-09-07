import type { FeatureFlags } from './featureFlags.types';

export const defaultFeatureFlags: FeatureFlags = {
  newDashboard: import.meta.env.VITE_FLAG_NEW_DASHBOARD === 'true',
  betaFeature: localStorage.getItem('FLAG_BETA_FEATURE') === 'true',
  test_show_count_button: import.meta.env.VITE_FLAG_COUNT_BUTTON === 'true',
  dog_list_enabled: import.meta.env.VITE_DOG_LIST_ENABLED === 'true',
};

export type FeatureFlag =
  | 'newDashboard'
  | 'betaFeature'
  | 'test_show_count_button'
  | 'pet_list_enabled';
export type FeatureFlags = Record<FeatureFlag, boolean>;

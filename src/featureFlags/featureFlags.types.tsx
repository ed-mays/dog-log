export type FeatureFlag =
  | 'newDashboard'
  | 'betaFeature'
  | 'test_show_count_button';
export type FeatureFlags = Record<FeatureFlag, boolean>;

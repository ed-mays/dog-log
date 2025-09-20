export type FeatureFlag =
  | 'newDashboard'
  | 'betaFeature'
  | 'test_show_count_button'
  | 'petListEnabled'
  | 'addPetEnabled'
  | 'authEnabled';
export type FeatureFlags = Record<FeatureFlag, boolean>;

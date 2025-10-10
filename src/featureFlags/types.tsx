export type FeatureFlag =
  | 'newDashboard'
  | 'betaFeature'
  | 'test_show_count_button'
  | 'petListEnabled'
  | 'addPetEnabled'
  | 'authEnabled'
  | 'petActionsEnabled';
export type FeatureFlags = Record<FeatureFlag, boolean>;

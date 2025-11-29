export type FeatureFlag =
  | 'petListEnabled'
  | 'addPetEnabled'
  | 'authEnabled'
  | 'petActionsEnabled'
  | 'navbarEnabled'
  | 'vetsEnabled'
  | 'vetLinkingEnabled'
  | 'petPhotosEnabled'
  | 'feedingsEnabled'
  | 'medicationsEnabled';
export type FeatureFlags = Record<FeatureFlag, boolean>;

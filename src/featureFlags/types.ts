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
  | 'medicationsEnabled'
  | 'themesEnabled';
export type FeatureFlags = Record<FeatureFlag, boolean>;

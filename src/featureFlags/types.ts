export type FeatureFlag =
  | 'petListEnabled'
  | 'addPetEnabled'
  | 'authEnabled'
  | 'petActionsEnabled'
  | 'navbarEnabled'
  | 'vetsEnabled'
  | 'vetLinkingEnabled'
  | 'petPhotosEnabled'
  | 'feedingsEnabled';
export type FeatureFlags = Record<FeatureFlag, boolean>;

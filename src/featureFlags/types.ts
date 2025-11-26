export type FeatureFlag =
  | 'petListEnabled'
  | 'addPetEnabled'
  | 'authEnabled'
  | 'petActionsEnabled'
  | 'navbarEnabled'
  | 'vetsEnabled'
  | 'vetLinkingEnabled'
  | 'petPhotosEnabled';
export type FeatureFlags = Record<FeatureFlag, boolean>;

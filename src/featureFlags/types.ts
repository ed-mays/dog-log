export type FeatureFlag =
  | 'petListEnabled'
  | 'addPetEnabled'
  | 'authEnabled'
  | 'petActionsEnabled'
  | 'navbarEnabled'
  | 'vetsEnabled'
  | 'vetLinkingEnabled';
export type FeatureFlags = Record<FeatureFlag, boolean>;

import type { FeatureFlags } from './types.ts';

export const defaultFeatureFlags: FeatureFlags = {
  petListEnabled: import.meta.env.VITE_FLAG_PET_LIST_ENABLED === 'true',
  addPetEnabled: import.meta.env.VITE_FLAG_ADD_PET_ENABLED === 'true',
  authEnabled: import.meta.env.VITE_FLAG_AUTH_ENABLED === 'true',
  petActionsEnabled: import.meta.env.VITE_FLAG_PET_ACTIONS_ENABLED === 'true',
  navbarEnabled: import.meta.env.VITE_FLAG_NAVBAR_ENABLED === 'true',
  // Support both VITE_FLAG_* (project convention) and plain VITE_* envs for new flags
  vetsEnabled:
    import.meta.env.VITE_FLAG_VETS_ENABLED === 'true' ||
    import.meta.env.VITE_VETS_ENABLED === 'true',
  vetLinkingEnabled:
    import.meta.env.VITE_FLAG_VET_LINKING_ENABLED === 'true' ||
    import.meta.env.VITE_VET_LINKING_ENABLED === 'true',
};

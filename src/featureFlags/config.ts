import type { FeatureFlags } from './types.ts';

export const defaultFeatureFlags: FeatureFlags = {
  petListEnabled: import.meta.env.VITE_FLAG_PET_LIST_ENABLED === 'true',
  addPetEnabled: import.meta.env.VITE_FLAG_ADD_PET_ENABLED === 'true',
  authEnabled: import.meta.env.VITE_FLAG_AUTH_ENABLED === 'true',
  petActionsEnabled: import.meta.env.VITE_FLAG_PET_ACTIONS_ENABLED === 'true',
  navbarEnabled: import.meta.env.VITE_FLAG_NAVBAR_ENABLED === 'true',
};

# Integrate Firebase Remote Config

Use this document to guide your implementation plan for Firebase Remote Config integration.

**IMPORTANT**: This whole implementation is breaking new ground for me. This document is my attempt to describe what I want you to implement. I expect you to challenge my assumptions and ask questions if something doesn't make sense to you. My goal is to model my feature flag usage after current best practices and to ensure that the implementation is robust and secure.

# Current Implementation

The current implementation of feature flags is a homegrown solution based on environment variables. It was implemented to raise awareness of feature flag practices and ensure that some infrastructure was in place as a starting point. Now I want to evolve this feature into a more robust solution using Firebase Remote Config.

At the same time, if you see opportunities in the code to use feature flags more effectively, please let me know. I want to make sure that the implementation is as robust as possible.

## Environment Variables

The existing environment variables for feature flags are defined in @src/env.local. and follow the pattern `VITE_FLAG_`. This is the list that we care about:

- VITE_FLAG_PET_LIST_ENABLED
- VITE_FLAG_ADD_PET_ENABLED
- VITE_FLAG_PET_ACTIONS_ENABLED
- VITE_FLAG_AUTH_ENABLED
- VITE_FLAG_NAVBAR_ENABLED
- VITE_FLAG_VETS_ENABLED
- VITE_FLAG_VET_LINKING_ENABLED

## Relevant Implementation Files:

### General Configuration

- @src/env.local
- @src/firebase-config.ts
- @src/firebase.ts

### Core Feature Flag Implementation

- @src/featureFlags/
  - ./types.ts
  - ./components/FeatureFlagsProvider.test.tsx
  - ./components/FeatureFlagsContext.ts
  - ./components/FeatureFlagsContext.test.tsx
  - ./components/FeatureFlagsProvider.tsx
  - ./hooks/useFeatureFlagsContext.ts
  - ./hooks/useFeatureFlagsContext.test.tsx
  - ./hooks/useFeatureFlag.test.tsx
  - ./hooks/useFeatureFlag.ts
  - ./config.ts

### Architecture

- FeatureFlagsProvider: This is the main component that provides the feature flags to the app.
- FeatureFlagsContext: This is the context that provides the feature flags to the app.
- useFeatureFlagsContext: This is the hook that provides the feature flags to the app.
- useFeatureFlag: This is the hook that provides a single feature flag to the app.

### Notes

- useFeatureFlagsContext appears to be unused. Consider removing it unless it makes sense in the new implementation. If so, then use it.
- Feature Flags are mostly used at the route and navigation bar levels.

## Firebase Remote Config

Firebase remote is not currently configured at all. As part of your output, I want a step by step guide to configure Firebase Remote Config in firebase console.

# Desired Implementation

I want to migrate from the app's current feature flag implementation to Firebase Remote Config. I want you to develop a step-by-step plan to migrate the feature flag implementation to Firebase Remote Config.

**IMPORTANT**: DO NOT START IMPLEMENTATION UNTIL I HAVE REVIEWED YOUR PLAN AND GIVEN YOU THE OKAY TO PROCEED.

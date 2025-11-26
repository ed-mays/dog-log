# Implementation Plan: Firebase Remote Config Migration

This plan outlines the steps to migrate the current environment-variable-based feature flag system to Firebase Remote Config.

## 1. Firebase Console Setup (Manual Step)

Before code changes, the Firebase project must be configured.

- [ x ] **Enable Remote Config**:
  1. Go to the [Firebase Console](https://console.firebase.google.com/).
  2. Select the project.
  3. In the left sidebar, under **Run**, click **Remote Config**.
  4. Click **Create Configuration** (or **Add Parameter** if already initialized).
- [ x ] **Add Feature Flags**:
  Add the following parameters with type **Boolean** and default value **false** (or match current prod state):
  - `petListEnabled`
  - `addPetEnabled`
  - `authEnabled`
  - `petActionsEnabled`
  - `navbarEnabled`
  - `vetsEnabled`
  - `vetLinkingEnabled`
- [ x ] **Publish**: Click **Publish Changes** to make them live.

## 2. Dependencies & Configuration

- [x] **Install SDK**: Ensure `firebase` SDK includes Remote Config (it usually does in the main package, but we verify).
- [x] **Update `src/firebase.ts`**:
  - Import `getRemoteConfig`, `connectRemoteConfigEmulator`.
  - Initialize Remote Config instance.
  - Configure settings:
    - **Dev/Local**: `fetchTimeoutMillis: 10000`, `minimumFetchIntervalMillis: 0` (real-time).
    - **Prod/Staging**: `minimumFetchIntervalMillis: 300000` (5 minutes).

## 3. Service Layer Implementation

Create a dedicated service to abstract Firebase specifics.

- [x] **Create `src/services/remoteConfig.ts`**:
  - `initRemoteConfig()`: Initialize and set default values (from `src/featureFlags/config.ts`).
  - `fetchAndActivateFlags()`: Wrapper for `fetchAndActivate`.
  - `getFeatureFlag(key)`: Wrapper for `getValue(remoteConfig, key).asBoolean()`.
  - **Hybrid Logic**: If `import.meta.env.DEV` is true, consider preferring local env vars or merging them to allow offline dev.

## 4. Feature Flags Provider Update

Refactor the provider to handle asynchronous loading.

- [x] **Update `src/featureFlags/components/FeatureFlagsProvider.tsx`**:
  - Add `loading` state (default `true`).
  - Add `useEffect` to call `remoteConfigService.init()` and `fetchAndActivate()`.
  - **Loading UI**:
    - Import `LoadingIndicator` from `@components/common/LoadingIndicator`.
    - Render `<LoadingIndicator />` while `loading` is true.
    - Render children once `loading` is false.
  - **State Update**:
    - Once fetched, read all flags from the service and update the `flags` state.
    - Ensure `setFlag` (for manual overrides/testing) still works or decide if it's needed (likely useful for testing).

## 5. Cleanup & Verification

- [x] **Verify Local Development**:
  - Run `npm run dev`.
  - Verify app loads with spinner.
  - Verify flags respect local `.env` (if hybrid approach used) or Remote Config (if emulators used).
- [x] **Verify Production Build**:
  - Run `npm run build` and `npm run preview`.
  - Verify 5-minute cache policy (via logs or network tab behavior).
- [x] **Tests**:
  - Update `FeatureFlagsProvider.test.tsx` to mock the async service and test the loading state.
  - Ensure `useFeatureFlag` hooks still work as expected.

## 6. Rollout

- [ ] Deploy to Staging.
- [ ] Verify flags can be toggled in Firebase Console and reflect in Staging (after refresh/interval).

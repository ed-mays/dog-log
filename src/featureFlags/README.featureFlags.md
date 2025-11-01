# Feature Flag Operations

## Add a Feature Flag

- Add a new Vite environment variable. For local development put it in `.env.local`
- Update `types.tsx` to add the new feature flag to the `FeatureFlags` type
- Edit `config.ts` to add the flag to `DefaultFeatureFlags`, reading from the Vite environment

## Consume a Feature Flag

- Import `useFeatureFlag` and query for individual flags, e.g. `const enablePetList = useFeatureFlag('petListEnabled');`
- Wrap the flagged code in a conditional that evaluates the feature flag

## Toggle a Feature Flag

- Update the Vite environment variable value
- Restart the server

## Testing Flags

- In tests, pass overrides via the provider: `<FeatureFlagsProvider initialFlags={{ addPetEnabled: true }}>`.

## Remove a Feature Flag

- Find usages of the flag and remove them. If the flag was toggling between legacy and new behaviors, remove the dead
  code
- Remove references to the flag from `.env.local`, `types.tsx`, and `config.ts`

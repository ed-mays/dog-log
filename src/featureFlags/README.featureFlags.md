# Feature Flag Strategy

The application uses a hybrid feature flag strategy that combines local defaults, Firebase Remote Config for remote management, and local overrides for development.

## Architecture

1.  **Default Values (Local):** Defined in `src/featureFlags/config.ts`. These values are read from Vite environment variables (`.env.local`) and serve as the fallback if Remote Config is unavailable or hasn't fetched yet.
2.  **Remote Configuration (Firebase):** Managed via `src/services/remoteConfig.ts`. The application fetches the latest configuration from Firebase Remote Config at startup and subscribes to real-time updates.
3.  **Local Overrides (DevTools):** Developers can override flags locally using the Feature Flags DevTool. These overrides are persisted in `localStorage` and take precedence over both Remote Config and default values.

**Precedence:** Local Overrides > Remote Config > Default Values (Env Vars)

## Adding a Feature Flag

1.  **Define the Type:** Add the new flag key to the `FeatureFlag` type in `src/featureFlags/types.ts`.
2.  **Set Default Value:** Add the flag to `defaultFeatureFlags` in `src/featureFlags/config.ts`. Map it to a corresponding environment variable (e.g., `VITE_FLAG_NEW_FEATURE`).
3.  **Configure Remote:** Add the parameter to the Firebase Remote Config console with the same key.

## Consuming a Feature Flag

Use the `useFeatureFlag` hook to check the status of a flag:

```typescript
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';

const MyComponent = () => {
  const isEnabled = useFeatureFlag('myNewFeature');

  if (!isEnabled) return null;

  return <div>New Feature Active</div>;
};
```

## Maintenance & Configuration

### Local Development

- **Defaults:** Configure in `.env.local` using the variables defined in `src/featureFlags/config.ts`.
- **Overrides:** Use the on-screen Feature Flags DevTool (if enabled) to toggle flags instantly without restarting.

### Remote Config (Firebase)

- The service logic is located in `src/services/remoteConfig.ts`.
- In **Development**, the fetch interval is set to 0 for near-instant updates.
- In **Production**, a cache interval is used to minimize network requests, but real-time updates (`onConfigUpdate`) are enabled to push changes immediately.

### Testing

In unit tests, wrap your component with `FeatureFlagsProvider` and pass `initialFlags` to force a specific state:

```tsx
render(
  <FeatureFlagsProvider initialFlags={{ myNewFeature: true }}>
    <MyComponent />
  </FeatureFlagsProvider>
);
```

## Removing a Feature Flag

1.  Remove usages in the code.
2.  Remove the key from `src/featureFlags/types.ts`.
3.  Remove the default entry from `src/featureFlags/config.ts`.
4.  Remove the parameter from Firebase Remote Config.

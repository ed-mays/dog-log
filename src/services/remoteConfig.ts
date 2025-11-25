import {
  fetchAndActivate,
  getValue,
  type RemoteConfig,
} from 'firebase/remote-config';
import { remoteConfig } from '../firebase';
import { defaultFeatureFlags } from '../featureFlags/config';
import type { FeatureFlag } from '../featureFlags/types';

class RemoteConfigService {
  private config: RemoteConfig;

  constructor() {
    this.config = remoteConfig;
  }

  /**
   * Initialize Remote Config with default values and settings.
   */
  async init(): Promise<void> {
    // Set default values from our local config
    // We need to convert boolean defaults to something Remote Config understands if needed,
    // but defaultFeatureFlags is Record<string, boolean>, which works for defaults.
    // However, setDefaults expects { [key: string]: string | number | boolean }
    this.config.defaultConfig = defaultFeatureFlags;

    // Configure fetch settings
    if (import.meta.env.DEV) {
      // In development, we want faster updates (or real-time)
      console.log('[RemoteConfig] Initializing in DEV mode (fast fetch)');
      this.config.settings.minimumFetchIntervalMillis = 0;
      this.config.settings.fetchTimeoutMillis = 10000;
    } else {
      // In production, cache for 5 minutes (300000ms)
      this.config.settings.minimumFetchIntervalMillis = 300000;
      this.config.settings.fetchTimeoutMillis = 60000;
    }
  }

  /**
   * Fetch and activate the latest configuration from the server.
   */
  async fetchAndActivate(): Promise<boolean> {
    try {
      console.log('[RemoteConfig] Fetching config...');
      const activated = await fetchAndActivate(this.config);
      console.log('[RemoteConfig] Fetch result (activated):', activated);
      console.log(
        '[RemoteConfig] Last fetch status:',
        this.config.lastFetchStatus
      );
      console.log(
        '[RemoteConfig] Last fetch time:',
        new Date(this.config.fetchTimeMillis).toISOString()
      );
      return activated;
    } catch (error) {
      console.error('[RemoteConfig] Failed to fetch config:', error);
      // We return false here so the app can continue with defaults
      return false;
    }
  }

  /**
   * Get a boolean feature flag value.
   * In DEV mode, we might want to prefer local env vars if they are explicitly set,
   * but for now, we follow the standard pattern: Remote Config > Defaults.
   * If you want local overrides, you can use the FeatureFlagsContext 'setFlag' or
   * rely on the fact that if fetch fails, we use defaults (which use env vars).
   */
  getFeatureFlag(key: FeatureFlag): boolean {
    // getValue returns a Value object. asBoolean() converts 'true', '1', 'on' to true.
    const val = getValue(this.config, key);
    // Log individual access if needed, but getAllFlags is better for overview
    return val.asBoolean();
  }

  /**
   * Get all feature flags as a dictionary.
   * Useful for initializing the provider state.
   */
  getAllFlags(): Record<FeatureFlag, boolean> {
    // We can't iterate keys easily in v9 SDK without getting all.
    // So we iterate our known keys.
    const flags: Partial<Record<FeatureFlag, boolean>> = {};
    const keys = Object.keys(defaultFeatureFlags) as FeatureFlag[];

    console.groupCollapsed('[RemoteConfig] All Flags');
    keys.forEach((key) => {
      const val = this.getFeatureFlag(key);
      flags[key] = val;
      console.log(`${key}:`, val);
    });
    console.groupEnd();

    return flags as Record<FeatureFlag, boolean>;
  }
}

export const remoteConfigService = new RemoteConfigService();

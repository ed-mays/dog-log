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
      const activated = await fetchAndActivate(this.config);
      if (activated) {
        console.debug('[RemoteConfig] Fetched and activated new config');
      } else {
        console.debug(
          '[RemoteConfig] Fetched config, but nothing new to activate'
        );
      }
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
    return getValue(this.config, key).asBoolean();
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

    keys.forEach((key) => {
      flags[key] = this.getFeatureFlag(key);
    });

    return flags as Record<FeatureFlag, boolean>;
  }
}

export const remoteConfigService = new RemoteConfigService();

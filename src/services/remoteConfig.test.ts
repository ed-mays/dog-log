import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the service so we test the real implementation, not the global mock from vitest.setup.ts
vi.unmock('./remoteConfig');

import { remoteConfigService } from './remoteConfig';
import {
  fetchAndActivate,
  getValue,
  onConfigUpdate,
  type Value,
  type ConfigUpdateObserver,
  type ConfigUpdate,
} from 'firebase/remote-config';
import { defaultFeatureFlags } from '../featureFlags/config';

// Mock firebase/remote-config
vi.mock('firebase/remote-config', () => ({
  fetchAndActivate: vi.fn(),
  getValue: vi.fn(),
  onConfigUpdate: vi.fn(),
}));

// Mock the firebase instance
vi.mock('../firebase', () => ({
  remoteConfig: {
    defaultConfig: {},
    settings: {
      minimumFetchIntervalMillis: 0,
      fetchTimeoutMillis: 0,
    },
    lastFetchStatus: 'success',
    fetchTimeMillis: Date.now(),
  },
}));

describe('RemoteConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('sets default config and fetch settings', async () => {
      await remoteConfigService.init();

      // Check if defaultConfig was set
      // We need to access the mocked remoteConfig object to verify
      const { remoteConfig } = await import('../firebase');
      expect(remoteConfig.defaultConfig).toEqual(defaultFeatureFlags);

      // Check settings (assuming test env is DEV)
      if (import.meta.env.DEV) {
        expect(remoteConfig.settings.minimumFetchIntervalMillis).toBe(0);
        expect(remoteConfig.settings.fetchTimeoutMillis).toBe(10000);
      }
    });
  });

  describe('fetchAndActivate', () => {
    it('returns true when fetch succeeds', async () => {
      vi.mocked(fetchAndActivate).mockResolvedValue(true);
      const result = await remoteConfigService.fetchAndActivate();
      expect(result).toBe(true);
      expect(fetchAndActivate).toHaveBeenCalled();
    });

    it('returns false when fetch returns false', async () => {
      vi.mocked(fetchAndActivate).mockResolvedValue(false);
      const result = await remoteConfigService.fetchAndActivate();
      expect(result).toBe(false);
    });

    it('returns false and logs error when fetch throws', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(fetchAndActivate).mockRejectedValue(new Error('Fetch failed'));

      const result = await remoteConfigService.fetchAndActivate();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch config'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getFeatureFlag', () => {
    it('returns boolean value from remote config', () => {
      const mockValue = {
        asBoolean: vi.fn().mockReturnValue(true),
      };
      vi.mocked(getValue).mockReturnValue(mockValue as unknown as Value);

      const result = remoteConfigService.getFeatureFlag('petListEnabled');
      expect(result).toBe(true);
      expect(getValue).toHaveBeenCalledWith(
        expect.anything(),
        'petListEnabled'
      );
      expect(mockValue.asBoolean).toHaveBeenCalled();
    });
  });

  describe('getAllFlags', () => {
    it('returns all flags defined in defaultFeatureFlags', () => {
      // Mock getValue to return true for all flags for simplicity
      const mockValue = {
        asBoolean: vi.fn().mockReturnValue(true),
      };
      vi.mocked(getValue).mockReturnValue(mockValue as unknown as Value);

      const flags = remoteConfigService.getAllFlags();
      const keys = Object.keys(defaultFeatureFlags);

      expect(Object.keys(flags)).toHaveLength(keys.length);
      keys.forEach((key) => {
        expect(flags[key as keyof typeof flags]).toBe(true);
      });
    });
  });

  describe('subscribeToUpdates', () => {
    it('subscribes to onConfigUpdate and calls callback on update', async () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      // Mock onConfigUpdate to simulate an update immediately or return unsubscribe
      vi.mocked(onConfigUpdate).mockImplementation(
        (_: unknown, observer: unknown) => {
          // Simulate an update if observer is an object with next
          const obs = observer as ConfigUpdateObserver;
          if (typeof obs === 'object' && obs.next) {
            obs.next({
              updatedKeys: ['petListEnabled'],
            } as unknown as ConfigUpdate);
          }
          return unsubscribe;
        }
      );

      // Mock fetchAndActivate to succeed
      vi.mocked(fetchAndActivate).mockResolvedValue(true);

      // Mock getValue to return a value
      const mockValue = { asBoolean: vi.fn().mockReturnValue(true) };
      vi.mocked(getValue).mockReturnValue(mockValue as unknown as Value);

      const resultUnsubscribe =
        remoteConfigService.subscribeToUpdates(callback);

      expect(onConfigUpdate).toHaveBeenCalled();
      expect(resultUnsubscribe).toBe(unsubscribe);

      // Since the mock calls next() immediately (sync in this mock implementation, but async in reality),
      // we might need to wait for promises if it was truly async.
      // But here we call it synchronously in the mock.
      // However, the 'next' function in remoteConfigService is async.
      // So we need to wait for the async operation in 'next' to complete.
      await new Promise(process.nextTick);

      expect(fetchAndActivate).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });
});

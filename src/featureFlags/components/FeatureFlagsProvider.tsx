import React, { useState, useEffect } from 'react';
import { FeatureFlagsContext } from './FeatureFlagsContext';
import type { FeatureFlags } from '../types.ts';
import { defaultFeatureFlags } from '../config.ts';
import { remoteConfigService } from '../../services/remoteConfig';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';

type Props = {
  children: React.ReactNode;
  initialFlags?: Partial<FeatureFlags>;
};

export const FeatureFlagsProvider: React.FC<Props> = ({
  children,
  initialFlags,
}) => {
  // Base flags from defaults + remote config
  const [remoteFlags, setRemoteFlags] = useState<FeatureFlags>({
    ...defaultFeatureFlags,
    ...(initialFlags ?? {}),
  });

  // Local overrides
  const [overrides, setOverrides] = useState<Partial<FeatureFlags>>(() => {
    if (initialFlags) return {}; // Don't load overrides in tests
    try {
      const saved = localStorage.getItem('featureFlagOverrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // If initialFlags are provided (e.g. tests), we skip loading state to render immediately.
  // Otherwise, we wait for remote config.
  const [loading, setLoading] = useState(!initialFlags);

  useEffect(() => {
    if (initialFlags) return;

    const init = async () => {
      await remoteConfigService.init();
      await remoteConfigService.fetchAndActivate();
      // Update flags with values from Remote Config (merges with defaults internally in service)
      setRemoteFlags((prev) => ({
        ...prev,
        ...remoteConfigService.getAllFlags(),
      }));
      setLoading(false);
    };

    init();

    // Subscribe to real-time updates
    const unsubscribe = remoteConfigService.subscribeToUpdates((newFlags) => {
      setRemoteFlags((prev) => ({ ...prev, ...newFlags }));
    });

    return () => {
      unsubscribe();
    };
  }, [initialFlags]);

  // Persist overrides when they change
  useEffect(() => {
    if (!initialFlags) {
      localStorage.setItem('featureFlagOverrides', JSON.stringify(overrides));
    }
  }, [overrides, initialFlags]);

  const setFlag = (key: keyof FeatureFlags, value: boolean) => {
    // For backward compatibility or direct manipulation, we update remoteFlags.
    // However, overrides will still take precedence if set.
    setRemoteFlags((f) => ({ ...f, [key]: value }));
  };

  const setOverride = (key: keyof FeatureFlags, value: boolean | undefined) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const resetOverrides = () => {
    setOverrides({});
  };

  // Merge remote flags with overrides
  const flags = { ...remoteFlags, ...overrides };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <FeatureFlagsContext.Provider
      value={{ flags, overrides, setFlag, setOverride, resetOverrides }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

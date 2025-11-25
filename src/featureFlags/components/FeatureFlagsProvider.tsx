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
  const [flags, setFlags] = useState<FeatureFlags>({
    ...defaultFeatureFlags,
    ...(initialFlags ?? {}),
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
      setFlags((prev) => ({ ...prev, ...remoteConfigService.getAllFlags() }));
      setLoading(false);
    };

    init();

    // Subscribe to real-time updates
    const unsubscribe = remoteConfigService.subscribeToUpdates((newFlags) => {
      setFlags((prev) => ({ ...prev, ...newFlags }));
    });

    return () => {
      unsubscribe();
    };
  }, [initialFlags]);

  const setFlag = (key: keyof FeatureFlags, value: boolean) => {
    setFlags((f) => ({ ...f, [key]: value }));
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <FeatureFlagsContext.Provider value={{ flags, setFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

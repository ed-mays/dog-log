import React, { useState, useEffect } from 'react';
import { FeatureFlagsContext } from './FeatureFlagsContext';
import type { FeatureFlags } from './featureFlags.types';
import { defaultFeatureFlags } from './featureFlags.config';

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFeatureFlags);

  useEffect(() => {
    const handler = () => {
      setFlags({
        ...flags,
        betaFeature: localStorage.getItem('FLAG_BETA_FEATURE') === 'true',
      });
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [flags]);

  const setFlag = (key: keyof FeatureFlags, value: boolean) => {
    setFlags((f) => ({ ...f, [key]: value }));
    if (key === 'betaFeature') {
      localStorage.setItem('FLAG_BETA_FEATURE', value ? 'true' : 'false');
    }
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, setFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

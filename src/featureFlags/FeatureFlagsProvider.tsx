import React, { useState } from 'react';
import { FeatureFlagsContext } from './FeatureFlagsContext';
import type { FeatureFlags } from './featureFlags.types';
import { defaultFeatureFlags } from './featureFlags.config';

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

  const setFlag = (key: keyof FeatureFlags, value: boolean) => {
    setFlags((f) => ({ ...f, [key]: value }));
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, setFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

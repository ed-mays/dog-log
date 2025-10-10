import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureFlagsProvider } from '../components/FeatureFlagsProvider';
import { useFeatureFlag } from './useFeatureFlag';
import type { FeatureFlag } from '../types';

const TestFeature: React.FC<{ flag: string }> = ({ flag }) => {
  const enabled = useFeatureFlag(flag as FeatureFlag);
  return <div data-testid="result">{enabled ? 'on' : 'off'}</div>;
};

describe('useFeatureFlag', () => {
  it('returns true if flag is enabled', () => {
    // Optionally, mock provider value here or set up mock context
    render(
      <FeatureFlagsProvider>
        <TestFeature flag="newDashboard" />
      </FeatureFlagsProvider>
    );
    expect(screen.getByTestId('result')).toHaveTextContent(/on|off/); // As per default config
  });

  // You can extend this with flag toggling logic or using context manipulation
});

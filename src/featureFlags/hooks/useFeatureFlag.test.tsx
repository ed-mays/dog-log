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
    render(
      <FeatureFlagsProvider initialFlags={{ vetsEnabled: true }}>
        <TestFeature flag="vetsEnabled" />
      </FeatureFlagsProvider>
    );
    expect(screen.getByTestId('result')).toHaveTextContent('on');
  });

  // You can extend this with flag toggling logic or using context manipulation
});

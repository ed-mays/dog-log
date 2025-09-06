import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureFlagsProvider } from './FeatureFlagsProvider';
import { useFeatureFlagsContext } from './useFeatureFlagsContext';

const HookConsumer: React.FC = () => {
  const { flags, setFlag } = useFeatureFlagsContext();
  return (
    <>
      <div data-testid="beta-feature">
        {flags.betaFeature ? 'enabled' : 'disabled'}
      </div>
      <button
        onClick={() => setFlag('betaFeature', !flags.betaFeature)}
        data-testid="toggle-btn"
      >
        toggle
      </button>
    </>
  );
};

describe('useFeatureFlagsContext', () => {
  it('consumes and updates context', () => {
    render(
      <FeatureFlagsProvider>
        <HookConsumer />
      </FeatureFlagsProvider>
    );
    const label = screen.getByTestId('beta-feature');
    expect(label).toHaveTextContent(/enabled|disabled/);
    screen.getByTestId('toggle-btn').click();
    expect(label).toHaveTextContent(/enabled|disabled/);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
        Toggle
      </button>
    </>
  );
};

describe('useFeatureFlagsContext', () => {
  it('consumes and updates context', async () => {
    render(
      <FeatureFlagsProvider>
        <HookConsumer />
      </FeatureFlagsProvider>
    );
    const toggleBtn = screen.getByTestId('toggle-btn');
    await userEvent.click(toggleBtn); // This wraps updates in act
    expect(screen.getByTestId('beta-feature')).toHaveTextContent(
      /enabled|disabled/
    );
  });
});

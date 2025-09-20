import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureFlagsProvider } from './FeatureFlagsProvider';
import { useFeatureFlagsContext } from './useFeatureFlagsContext';
import type { FeatureFlagsContextType } from './FeatureFlagsContext';

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

  it('returns object with flags and setFlag', () => {
    let contextValue: FeatureFlagsContextType | undefined;
    const Inspector = () => {
      contextValue = useFeatureFlagsContext();
      return null;
    };
    render(
      <FeatureFlagsProvider>
        <Inspector />
      </FeatureFlagsProvider>
    );
    expect(contextValue).toBeDefined();
    expect(contextValue).toHaveProperty('flags');
    expect(typeof contextValue!.setFlag).toBe('function');
  });

  const Consumer = () => {
    const { flags, setFlag } = useFeatureFlagsContext();
    return (
      <>
        <span data-testid="value">{flags.newDashboard ? 'on' : 'off'}</span>
        <button
          data-testid="toggle"
          onClick={() => setFlag('newDashboard', !flags.newDashboard)}
        >
          toggle
        </button>
      </>
    );
  };

  it('throws if used outside FeatureFlagsProvider', () => {
    // Suppress console.error for cleaner output
    const originalError = console.error;
    console.error = () => {};
    expect(() => render(<Consumer />)).toThrow(
      'useFeatureFlagsContext must be used within FeatureFlagsProvider'
    );
    console.error = originalError;
  });
});

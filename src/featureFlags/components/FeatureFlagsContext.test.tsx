import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  FeatureFlagsContext,
  type FeatureFlagsContextType,
} from './FeatureFlagsContext';
import type { FeatureFlags } from '../types';

const allFalseFlags: FeatureFlags = {
  newDashboard: false,
  betaFeature: false,
  test_show_count_button: false,
  petListEnabled: false,
  addPetEnabled: false,
  authEnabled: false,
};

describe('FeatureFlagsContext', () => {
  it('is undefined by default when no Provider is present', () => {
    const Probe: React.FC = () => {
      const ctx = React.useContext(FeatureFlagsContext);
      return (
        <div data-testid="status">
          {ctx === undefined ? 'missing' : 'present'}
        </div>
      );
    };

    render(<Probe />);
    expect(screen.getByTestId('status')).toHaveTextContent('missing');
  });

  it('provides value through Provider and allows consumers to use it', async () => {
    const setFlag = vi.fn();
    const value: FeatureFlagsContextType = {
      flags: { ...allFalseFlags, newDashboard: true },
      setFlag,
    };

    const Consumer: React.FC = () => {
      const ctx = React.useContext(FeatureFlagsContext)!;
      return (
        <>
          <span data-testid="flag">
            {ctx.flags.newDashboard ? 'on' : 'off'}
          </span>
          <button
            data-testid="toggle"
            onClick={() => ctx.setFlag('newDashboard', !ctx.flags.newDashboard)}
          >
            toggle
          </button>
        </>
      );
    };

    render(
      <FeatureFlagsContext.Provider value={value}>
        <Consumer />
      </FeatureFlagsContext.Provider>
    );

    // Reads the provided value
    expect(screen.getByTestId('flag')).toHaveTextContent('on');

    // Interacts with provided setter
    await userEvent.click(screen.getByTestId('toggle'));
    expect(setFlag).toHaveBeenCalledWith('newDashboard', false);
  });
});

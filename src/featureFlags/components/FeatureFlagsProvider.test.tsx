import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureFlagsProvider } from './FeatureFlagsProvider';
import { FeatureFlagsContext } from './FeatureFlagsContext';
import { vi, type Mock } from 'vitest';
import { remoteConfigService } from '../../services/remoteConfig';

// Mock the remote config service
vi.mock('../../services/remoteConfig', () => ({
  remoteConfigService: {
    init: vi.fn(),
    fetchAndActivate: vi.fn(),
    getAllFlags: vi.fn(() => ({ vetsEnabled: true })),
    subscribeToUpdates: vi.fn(() => vi.fn()),
  },
}));

const TestChild: React.FC = () => {
  const ctx = React.useContext(FeatureFlagsContext);
  if (!ctx) return null;
  return (
    <>
      <div data-testid="new-dashboard">
        {ctx.flags.vetsEnabled ? 'on' : 'off'}
      </div>
      <button
        onClick={() => ctx.setFlag('vetsEnabled', !ctx.flags.vetsEnabled)}
        data-testid="toggle-btn"
      >
        toggle
      </button>
    </>
  );
};

describe('FeatureFlagsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator initially and then renders children', async () => {
    (remoteConfigService.fetchAndActivate as Mock).mockResolvedValue(true);

    render(
      <FeatureFlagsProvider>
        <TestChild />
      </FeatureFlagsProvider>
    );

    // Should show loading indicator first
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('new-dashboard')).not.toBeInTheDocument();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Should show children with fetched flags
    expect(screen.getByTestId('new-dashboard')).toHaveTextContent('on');
    expect(remoteConfigService.init).toHaveBeenCalled();
    expect(remoteConfigService.fetchAndActivate).toHaveBeenCalled();
  });

  it('skips loading if initialFlags are provided', () => {
    render(
      <FeatureFlagsProvider initialFlags={{ vetsEnabled: false }}>
        <TestChild />
      </FeatureFlagsProvider>
    );

    // Should render immediately without loading
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('new-dashboard')).toHaveTextContent('off');
  });

  it('toggles feature flag and updates UI', async () => {
    (remoteConfigService.fetchAndActivate as Mock).mockResolvedValue(true);

    render(
      <FeatureFlagsProvider>
        <TestChild />
      </FeatureFlagsProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const toggleBtn = screen.getByTestId('toggle-btn');
    await userEvent.click(toggleBtn);

    expect(screen.getByTestId('new-dashboard')).toHaveTextContent('off');
  });

  it('supports overrides and persists them', async () => {
    (remoteConfigService.fetchAndActivate as Mock).mockResolvedValue(true);

    // Clear storage before test
    window.localStorage.clear();

    const OverrideChild = () => {
      const ctx = React.useContext(FeatureFlagsContext);
      if (!ctx) return null;
      return (
        <>
          <div data-testid="status">
            {ctx.flags.vetsEnabled ? 'enabled' : 'disabled'}
          </div>
          <button
            onClick={() => ctx.setOverride('vetsEnabled', false)}
            data-testid="disable-btn"
          >
            Disable
          </button>
          <button onClick={() => ctx.resetOverrides()} data-testid="reset-btn">
            Reset
          </button>
        </>
      );
    };

    render(
      <FeatureFlagsProvider>
        <OverrideChild />
      </FeatureFlagsProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Initially enabled (from mock)
    expect(screen.getByTestId('status')).toHaveTextContent('enabled');

    // Override to false
    await userEvent.click(screen.getByTestId('disable-btn'));
    expect(screen.getByTestId('status')).toHaveTextContent('disabled');

    expect(window.localStorage.getItem('featureFlagOverrides')).toBe(
      JSON.stringify({ vetsEnabled: false })
    );

    // Reset overrides
    await userEvent.click(screen.getByTestId('reset-btn'));
    expect(screen.getByTestId('status')).toHaveTextContent('enabled');
    expect(window.localStorage.getItem('featureFlagOverrides')).toBe(
      JSON.stringify({})
    );
  });
});

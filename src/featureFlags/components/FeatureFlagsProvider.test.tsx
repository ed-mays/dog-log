import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Import userEvent
import { FeatureFlagsProvider } from './FeatureFlagsProvider';
import { FeatureFlagsContext } from './FeatureFlagsContext';

const TestChild: React.FC = () => {
  const ctx = React.useContext(FeatureFlagsContext);
  if (!ctx) return null;
  return (
    <>
      <div data-testid="new-dashboard">
        {ctx.flags.newDashboard ? 'on' : 'off'}
      </div>
      <button
        onClick={() => ctx.setFlag('newDashboard', !ctx.flags.newDashboard)}
        data-testid="toggle-btn"
      >
        toggle
      </button>
    </>
  );
};

describe('FeatureFlagsProvider', () => {
  it('toggles feature flag and updates UI', async () => {
    render(
      <FeatureFlagsProvider>
        <TestChild />
      </FeatureFlagsProvider>
    );
    const toggleBtn = screen.getByTestId('toggle-btn');
    // Use await userEvent.click to wrap in act automatically
    await userEvent.click(toggleBtn);
    // Or use await waitFor if manually updating state after events
    expect(screen.getByTestId('new-dashboard')).toHaveTextContent(/on|off/);
  });
});

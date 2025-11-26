import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureFlagsDevTool } from './FeatureFlagsDevTool';
import { FeatureFlagsContext } from './FeatureFlagsContext';
import { vi } from 'vitest';
import type { FeatureFlags } from '../types';

// Mock data
const mockFlags: FeatureFlags = {
  petListEnabled: true,
  addPetEnabled: true,
  authEnabled: true,
  petActionsEnabled: true,
  navbarEnabled: true,
  vetsEnabled: false,
  vetLinkingEnabled: false,
};

const mockOverrides: Partial<FeatureFlags> = {};

const mockSetOverride = vi.fn();
const mockResetOverrides = vi.fn();
const mockSetFlag = vi.fn();

const renderWithContext = (
  overrides: Partial<FeatureFlags> = mockOverrides
) => {
  return render(
    <FeatureFlagsContext.Provider
      value={{
        flags: { ...mockFlags, ...overrides },
        overrides,
        setFlag: mockSetFlag,
        setOverride: mockSetOverride,
        resetOverrides: mockResetOverrides,
      }}
    >
      <FeatureFlagsDevTool />
    </FeatureFlagsContext.Provider>
  );
};

describe('FeatureFlagsDevTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the toggle button initially', () => {
    renderWithContext();
    expect(
      screen.getByRole('button', { name: /open feature flags devtools/i })
    ).toBeInTheDocument();
    expect(screen.queryByText('Feature Flags')).not.toBeInTheDocument();
  });

  it('opens and closes the panel', async () => {
    const user = userEvent.setup();
    renderWithContext();

    // Open
    await user.click(
      screen.getByRole('button', { name: /open feature flags devtools/i })
    );
    expect(screen.getByText('Feature Flags')).toBeInTheDocument();

    // Close
    await user.click(
      screen.getByRole('button', { name: /close feature flags devtools/i })
    );
    expect(screen.queryByText('Feature Flags')).not.toBeInTheDocument();
  });

  it('displays all flags with correct status', async () => {
    const user = userEvent.setup();
    renderWithContext();
    await user.click(
      screen.getByRole('button', { name: /open feature flags devtools/i })
    );

    // Check a few flags
    expect(screen.getByText('petListEnabled')).toBeInTheDocument();
    expect(screen.getByText('vetsEnabled')).toBeInTheDocument();
  });

  it('calls setOverride when toggling a flag', async () => {
    const user = userEvent.setup();
    renderWithContext();
    await user.click(
      screen.getByRole('button', { name: /open feature flags devtools/i })
    );

    const trueOption = screen.getByRole('radio', { name: 'vetsEnabled True' });
    await user.click(trueOption);
    expect(mockSetOverride).toHaveBeenCalledWith('vetsEnabled', true);

    const falseOption = screen.getByRole('radio', {
      name: 'vetsEnabled False',
    });
    await user.click(falseOption);
    expect(mockSetOverride).toHaveBeenCalledWith('vetsEnabled', false);
  });

  it('calls setOverride with undefined when clicking Default', async () => {
    const user = userEvent.setup();
    // Render with an override so "True" is checked and "Default" is unchecked
    renderWithContext({ vetsEnabled: true });

    await user.click(
      screen.getByRole('button', { name: /open feature flags devtools/i })
    );

    const defaultOption = screen.getByRole('radio', {
      name: 'vetsEnabled Default',
    });
    await user.click(defaultOption);
    expect(mockSetOverride).toHaveBeenCalledWith('vetsEnabled', undefined);
  });

  it('calls resetOverrides when reset button is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext({ vetsEnabled: true }); // Simulate an override existing
    await user.click(
      screen.getByRole('button', { name: /open feature flags devtools/i })
    );

    await user.click(
      screen.getByRole('button', { name: /reset all overrides/i })
    );
    expect(mockResetOverrides).toHaveBeenCalled();
  });
});

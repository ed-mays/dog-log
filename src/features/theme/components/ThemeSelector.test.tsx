import { render, screen } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeSelector } from './ThemeSelector';
import { useThemeStore } from '@store/theme.store';
import * as featureFlagsHooks from '@featureFlags/hooks/useFeatureFlag';

// Mock useFeatureFlag
const useFeatureFlagSpy = vi.spyOn(featureFlagsHooks, 'useFeatureFlag');

describe('ThemeSelector', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light' });
    vi.clearAllMocks();
  });

  it('renders nothing when feature flag is disabled', () => {
    useFeatureFlagSpy.mockReturnValue(false);
    render(<ThemeSelector />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders toggle button when feature flag is enabled', () => {
    useFeatureFlagSpy.mockReturnValue(true);
    render(<ThemeSelector />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('toggles theme when clicked', async () => {
    useFeatureFlagSpy.mockReturnValue(true);
    const user = userEvent.setup();
    render(<ThemeSelector />);

    const button = screen.getByRole('button');

    // Initial state (light) -> shows moon icon (Brightness4)
    // We can check aria-label or icon presence.
    // The implementation sets aria-label based on next state.
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');

    await user.click(button);

    expect(useThemeStore.getState().mode).toBe('dark');

    // After toggle (dark) -> shows sun icon (Brightness7)
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });
});

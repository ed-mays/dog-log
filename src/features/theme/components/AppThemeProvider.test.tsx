import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppThemeProvider } from './AppThemeProvider';
import { useThemeStore } from '@store/theme.store';
import * as featureFlagsHooks from '@featureFlags/hooks/useFeatureFlag';
import { useTheme } from '@mui/material';

// Mock useFeatureFlag
const useFeatureFlagSpy = vi.spyOn(featureFlagsHooks, 'useFeatureFlag');

// Helper component to check the current theme mode
function ThemeChecker() {
  const theme = useTheme();
  return <div data-testid="theme-mode">{theme.palette.mode}</div>;
}

describe('AppThemeProvider', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light' });
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    useFeatureFlagSpy.mockReturnValue(true);
    render(
      <AppThemeProvider>
        <div data-testid="child">Child Content</div>
      </AppThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('uses light theme by default', () => {
    useFeatureFlagSpy.mockReturnValue(true);
    render(
      <AppThemeProvider>
        <ThemeChecker />
      </AppThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  it('uses dark theme when mode is dark and feature flag is enabled', () => {
    useFeatureFlagSpy.mockReturnValue(true);
    useThemeStore.setState({ mode: 'dark' });

    render(
      <AppThemeProvider>
        <ThemeChecker />
      </AppThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  it('forces light theme when feature flag is disabled, even if store is dark', () => {
    useFeatureFlagSpy.mockReturnValue(false);
    useThemeStore.setState({ mode: 'dark' });

    render(
      <AppThemeProvider>
        <ThemeChecker />
      </AppThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });
});

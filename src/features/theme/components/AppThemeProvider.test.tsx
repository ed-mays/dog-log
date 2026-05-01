import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppThemeProvider } from './AppThemeProvider';
import { useThemeStore } from '@store/theme.store';
import * as featureFlagsHooks from '@featureFlags/hooks/useFeatureFlag';
import { useTheme } from '@mui/material';

// Mock useFeatureFlag
const useFeatureFlagSpy = vi.spyOn(featureFlagsHooks, 'useFeatureFlag');

// Helper component to expose theme details for assertions
function ThemeChecker() {
  const theme = useTheme();
  return (
    <>
      <div data-testid="theme-mode">{theme.palette.mode}</div>
      <div data-testid="theme-bg">{theme.palette.background.default}</div>
      <div data-testid="theme-primary">{theme.palette.primary.main}</div>
    </>
  );
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

  it('uses caregiver theme when mode is caregiver and feature flag is enabled', () => {
    useFeatureFlagSpy.mockReturnValue(true);
    useThemeStore.setState({ mode: 'caregiver' });

    render(
      <AppThemeProvider>
        <ThemeChecker />
      </AppThemeProvider>
    );

    // mode resolves to 'dark' under MUI (caregiver palette is dark-mode-based)
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    // but the warm-dark background and peach primary identify the caregiver palette
    expect(screen.getByTestId('theme-bg')).toHaveTextContent('#1A1208');
    expect(screen.getByTestId('theme-primary')).toHaveTextContent('#FFB47A');
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

  it('forces light theme when feature flag is disabled, even if store is caregiver', () => {
    useFeatureFlagSpy.mockReturnValue(false);
    useThemeStore.setState({ mode: 'caregiver' });

    render(
      <AppThemeProvider>
        <ThemeChecker />
      </AppThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });
});

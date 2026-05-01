import type { ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import type { Theme } from '@mui/material';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useThemeStore } from '@store/theme.store';
import type { ThemeMode } from '@store/theme.store';
import { lightTheme, darkTheme, caregiverTheme } from '../theme';

interface AppThemeProviderProps {
  children: ReactNode;
}

const themesByMode: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  caregiver: caregiverTheme,
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const themesEnabled = useFeatureFlag('themesEnabled');
  const { mode } = useThemeStore();

  const activeMode: ThemeMode = themesEnabled ? mode : 'light';
  const theme = themesByMode[activeMode] ?? lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

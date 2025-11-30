import type { ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useThemeStore } from '@store/theme.store';
import { lightTheme, darkTheme } from '../theme';

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const themesEnabled = useFeatureFlag('themesEnabled');
  const { mode } = useThemeStore();

  const activeMode = themesEnabled ? mode : 'light';
  const theme = activeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n.ts';
import { FeatureFlagsProvider } from '@featureFlags/components/FeatureFlagsProvider.tsx';
import { ErrorBoundary } from '@components/common/ErrorBoundary/ErrorBoundary';
import AuthBootstrap from '@features/authentication/AuthBootstrap.ts';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  typography: {
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <FeatureFlagsProvider>
        <ErrorBoundary>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthBootstrap />
            <App />
          </ThemeProvider>
        </ErrorBoundary>
      </FeatureFlagsProvider>
    </BrowserRouter>
  </StrictMode>
);

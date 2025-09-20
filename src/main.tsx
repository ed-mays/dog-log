import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';
import { FeatureFlagsProvider } from './featureFlags/FeatureFlagsProvider';
import { ErrorBoundary } from '@components/common/ErrorBoundary/ErrorBoundary';
import AuthBootstrap from '@features/authentication/AuthBootstrap';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FeatureFlagsProvider>
      <ErrorBoundary>
        <AuthBootstrap />
        <App />
      </ErrorBoundary>
    </FeatureFlagsProvider>
  </StrictMode>
);

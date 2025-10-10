import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';
import { FeatureFlagsProvider } from '@featureFlags/components/FeatureFlagsProvider.tsx';
import { ErrorBoundary } from '@components/common/ErrorBoundary/ErrorBoundary';
import AuthBootstrap from '@features/authentication/AuthBootstrap';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <FeatureFlagsProvider>
        <ErrorBoundary>
          <AuthBootstrap />
          <App />
        </ErrorBoundary>
      </FeatureFlagsProvider>
    </BrowserRouter>
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import './i18n.tsx';
import { FeatureFlagsProvider } from './featureFlags/FeatureFlagsContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FeatureFlagsProvider>
      <App />
    </FeatureFlagsProvider>
  </StrictMode>
);

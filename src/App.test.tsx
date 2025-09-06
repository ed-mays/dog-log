import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import { FeatureFlagsProvider } from './featureFlags/FeatureFlagsProvider.tsx';

test('renders welcome message', () => {
  render(
    <FeatureFlagsProvider>
      <App />
    </FeatureFlagsProvider>
  );
  expect(screen.getByText(/Dog-Log/i)).toBeInTheDocument();
});

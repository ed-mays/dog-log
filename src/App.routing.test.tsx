import { render, screen, waitFor } from '@/test-utils';
import i18n from '@testUtils/test-i18n';
import App from './App';

describe('Routing and navigation hygiene', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('shows a localized feature-unavailable screen when pet list is disabled', async () => {
    render(<App />, {
      featureFlags: { petListEnabled: false },
      i18nInstance: i18n,
    });
    await waitFor(() => {
      expect(screen.getByText('Feature not enabled')).toBeInTheDocument();
    });
  });
});

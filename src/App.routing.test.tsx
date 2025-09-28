import { render, screen, waitFor } from '@/test-utils';
import i18n from '@testUtils/test-i18n';
import App from './App';
import { useAuthStore } from '@store/auth.store';
import { usePetsStore } from '@store/pets.store';

// Mock child components with side-effects
vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));
vi.mock('@store/auth.store');
vi.mock('@store/pets.store');

describe('Routing and navigation hygiene', () => {
  const mockUseAuthStore = useAuthStore as vi.Mock;
  const mockUsePetsStore = usePetsStore as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    i18n.changeLanguage('en');
    // Provide default mocks for stores to prevent side-effects
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ user: null, initializing: false })
    );
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [], fetchPets: vi.fn() })
    );
  });

  it('shows a localized feature-unavailable screen when pet list is disabled', async () => {
    render(<App />, {
      featureFlags: { petListEnabled: false },
      i18nInstance: i18n,
      initialRoutes: ['/pets'],
    });
    await waitFor(() => {
      expect(screen.getByText('Feature not enabled')).toBeInTheDocument();
    });
  });
});

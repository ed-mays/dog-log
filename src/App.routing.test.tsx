import { render, screen, waitFor } from '@test-utils';
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
    // Provide default mocks for stores to prevent side-effects
    const authState = { user: null, initializing: false };
    mockUseAuthStore.mockImplementation((selector) =>
      selector ? selector(authState) : authState
    );
    const petsState = { pets: [], fetchPets: vi.fn() };
    mockUsePetsStore.mockImplementation((selector) =>
      selector ? selector(petsState) : petsState
    );
  });

  it('shows a localized feature-unavailable screen when pet list is disabled', async () => {
    const authState = {
      user: { uid: 'test-user' },
      initializing: false,
    };
    mockUseAuthStore.mockImplementation((selector) =>
      selector ? selector(authState) : authState
    );
    render(<App />, {
      featureFlags: { petListEnabled: false, authEnabled: true },
      initialRoutes: ['/pets'],
    });
    await waitFor(() => {
      expect(screen.getByText('Feature not enabled')).toBeInTheDocument();
    });
  });
});

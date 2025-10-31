import { render, screen } from '@test-utils';
import App from './App';
import { useAuthStore } from '@store/auth.store';
import { usePetsStore } from '@store/pets.store';
import type { AppUser } from '@services/auth/authService';
import {
  createAuthStoreMock,
  createPetsStoreMock,
} from '@testUtils/mocks/mockStores';

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
    mockUseAuthStore.mockImplementation(
      createAuthStoreMock({ user: null, initializing: false })
        .impl as unknown as typeof useAuthStore
    );
    mockUsePetsStore.mockImplementation(
      createPetsStoreMock({ pets: [] }).impl as unknown as typeof usePetsStore
    );
  });

  it('shows a localized feature-unavailable screen when pet list is disabled', async () => {
    mockUseAuthStore.mockImplementation(
      createAuthStoreMock({
        user: {
          uid: 'test-user',
          displayName: null,
          email: null,
          photoURL: null,
        } satisfies AppUser,
        initializing: false,
      }).impl as unknown as typeof useAuthStore
    );
    render(<App />, {
      featureFlags: { petListEnabled: false, authEnabled: true },
      initialRoutes: ['/pets'],
    });
    expect(await screen.findByText('Feature not enabled')).toBeInTheDocument();
  });
});

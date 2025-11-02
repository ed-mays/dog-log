import { render, screen } from '@test-utils';
import App from './App';
import { useAuthStore } from '@store/auth.store';
import { usePetsStore } from '@store/pets.store';
import type { AppUser } from '@services/auth/authService';
import {
  createAuthStoreMock,
  createPetsStoreMock,
} from '@testUtils/mocks/mockStores';
import { vi } from 'vitest';

// Mock child components with side-effects
vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));

// Explicitly mock stores to ensure vi.fn() instances are used
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

describe('Routing and navigation hygiene', () => {
  // Declare these as `let` so they can be assigned the actual mock functions
  let mockUseAuthStore: typeof useAuthStore;
  let mockUsePetsStore: typeof usePetsStore;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules(); // Ensure a clean slate for module imports

    // Dynamically import the mocked modules to get the vi.fn() instances
    const authStoreModule = await import('@store/auth.store');
    mockUseAuthStore = authStoreModule.useAuthStore;
    const petsStoreModule = await import('@store/pets.store');
    mockUsePetsStore = petsStoreModule.usePetsStore;

    // Provide default mocks for stores to prevent side-effects
    (mockUseAuthStore as vi.Mock).mockImplementation(
      createAuthStoreMock({ user: null, initializing: false })
        .impl as unknown as typeof useAuthStore
    );
    (mockUsePetsStore as vi.Mock).mockImplementation(
      createPetsStoreMock({ pets: [] }).impl as unknown as typeof usePetsStore
    );
  });

  it('shows a localized feature-unavailable screen when pet list is disabled', async () => {
    (mockUseAuthStore as vi.Mock).mockImplementation(
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

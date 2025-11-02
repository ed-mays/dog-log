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

// Additional app-level routing integration tests
describe('App routing integration (additional)', () => {
  let mockUseAuthStore: typeof useAuthStore;
  let mockUsePetsStore: typeof usePetsStore;
  let renderTestUtils: typeof import('@test-utils').render;
  let AppComponent: React.ComponentType;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules();

    const authStoreModule = await import('@store/auth.store');
    mockUseAuthStore = authStoreModule.useAuthStore;
    const petsStoreModule = await import('@store/pets.store');
    mockUsePetsStore = petsStoreModule.usePetsStore;

    // Re-import render wrapper to ensure same module instance for providers/contexts
    const testUtilsModule = await import('@test-utils');
    renderTestUtils = testUtilsModule.render;

    const appModule = await import('./App');
    AppComponent = appModule.default;

    // Default stores
    (mockUseAuthStore as vi.Mock).mockImplementation(
      createAuthStoreMock({ user: null, initializing: false })
        .impl as unknown as typeof useAuthStore
    );
    (mockUsePetsStore as vi.Mock).mockImplementation(
      createPetsStoreMock({ pets: [] }).impl as unknown as typeof usePetsStore
    );
  });

  it('renders pet list at /pets when authenticated and petListEnabled=true', async () => {
    // Set authenticated user
    (mockUseAuthStore as vi.Mock).mockImplementation(
      createAuthStoreMock({
        user: {
          uid: 'test-user',
          displayName: null,
          email: null,
          photoURL: null,
        } as AppUser,
        initializing: false,
      }).impl as unknown as typeof useAuthStore
    );

    renderTestUtils(<AppComponent />, {
      featureFlags: { petListEnabled: true, authEnabled: true },
      initialRoutes: ['/pets'],
    });

    expect(await screen.findByTestId('pet-list')).toBeInTheDocument();
  });

  it('renders Feature Unavailable page when navigating directly to /feature-unavailable', async () => {
    // Set authenticated user; flags don't matter for this route
    (mockUseAuthStore as vi.Mock).mockImplementation(
      createAuthStoreMock({
        user: {
          uid: 'test-user',
          displayName: null,
          email: null,
          photoURL: null,
        } as AppUser,
        initializing: false,
      }).impl as unknown as typeof useAuthStore
    );

    renderTestUtils(<AppComponent />, {
      featureFlags: { petListEnabled: true, authEnabled: true },
      initialRoutes: ['/feature-unavailable'],
    });

    expect(await screen.findByText('Feature not enabled')).toBeInTheDocument();
  });
});

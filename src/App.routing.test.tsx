import { render } from '@test-utils';
import App from './App';
import type { AppUser } from '@services/auth/authService';
import { vi } from 'vitest';
import {
  installAuthStoreMock,
  installPetsStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';
import {
  expectFeatureUnavailable,
  expectPetListVisible,
} from '@testUtils/routes';

// Explicitly mock stores to ensure vi.fn() instances are used
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

describe('Routing and navigation hygiene', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installPetsStoreMock({ pets: [] });
    installAuthStoreMock({ user: null, initializing: false });
  });

  it('shows a localized feature-unavailable screen when pet list is disabled', async () => {
    installAuthStoreMock({
      user: {
        uid: 'test-user',
        displayName: null,
        email: null,
        photoURL: null,
      } as AppUser,
      initializing: false,
    });

    render(<App />, {
      featureFlags: { petListEnabled: false, authEnabled: true },
      initialRoutes: ['/pets'],
    });

    await expectFeatureUnavailable();
  });

  it('renders pet list at /pets when authenticated and petListEnabled=true', async () => {
    installAuthStoreMock({
      user: { uid: 'test-user' } as AppUser,
      initializing: false,
    });

    render(<App />, {
      featureFlags: { petListEnabled: true, authEnabled: true },
      initialRoutes: ['/pets'],
    });

    await expectPetListVisible();
  });

  it('renders Feature Unavailable page when navigating directly to /feature-unavailable', async () => {
    installAuthStoreMock({
      user: { uid: 'test-user' } as AppUser,
      initializing: false,
    });

    render(<App />, {
      featureFlags: { petListEnabled: true, authEnabled: true },
      initialRoutes: ['/feature-unavailable'],
    });

    await expectFeatureUnavailable();
  });

  it('redirects from /welcome to /pets when authenticated', async () => {
    installAuthStoreMock({
      user: { uid: 'test-user' } as AppUser,
      initializing: false,
    });

    render(<App />, {
      featureFlags: { petListEnabled: true, authEnabled: true },
      initialRoutes: ['/welcome'],
    });

    await expectPetListVisible();
  });
});

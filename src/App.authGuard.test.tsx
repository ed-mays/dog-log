import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, waitFor } from '@test-utils';
import App from './App';
import { useAuthStore } from '@store/auth.store';
import { usePetsStore } from '@store/pets.store';

// Mock child components with side-effects
vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));

// Explicitly mock useAuthStore and usePetsStore as vi.fn()
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

describe('App auth route protection', () => {
  // Declare these as `let` so they can be assigned the actual mock functions
  let mockUseAuthStore: typeof useAuthStore;
  let mockUsePetsStore: typeof usePetsStore;

  beforeEach(async () => {
    vi.resetAllMocks();
    // Dynamically import the mocked modules to get the vi.fn() instances
    const authStoreModule = await import('@store/auth.store');
    mockUseAuthStore = authStoreModule.useAuthStore;
    const petsStoreModule = await import('@store/pets.store');
    mockUsePetsStore = petsStoreModule.usePetsStore;

    // Prevent pet pre-fetcher from looping
    const petsState = { pets: [{ id: '1' }] };
    (mockUsePetsStore as vi.Mock).mockImplementation((selector) =>
      selector ? selector(petsState) : petsState
    );
  });

  it('redirects unauthenticated users to /welcome for /pets', async () => {
    const authStoreState = { user: null, initializing: false };
    (mockUseAuthStore as vi.Mock).mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );

    render(<App />, { initialRoutes: ['/pets'] });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /welcome/i })
      ).toBeInTheDocument();
    });
  });

  it('allows authenticated users to access /pets', async () => {
    const authStoreState = { user: { uid: '1' }, initializing: false };
    (mockUseAuthStore as vi.Mock).mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );

    render(<App />, { initialRoutes: ['/pets'] });

    await waitFor(() => {
      expect(screen.getByTestId('pet-list')).toBeInTheDocument();
    });
  });
});

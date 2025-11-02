import { describe, it, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
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
  beforeEach(() => {
    vi.resetAllMocks();

    // Prevent pet pre-fetcher from looping
    const petsState = { pets: [{ id: '1' }] };
    vi.mocked(usePetsStore).mockImplementation((selector) =>
      selector ? selector(petsState) : petsState
    );
  });

  it('redirects unauthenticated users to /welcome for /pets', async () => {
    const authStoreState = { user: null, initializing: false };
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );

    render(<App />, { initialRoutes: ['/pets'] });

    await screen.findByRole('heading', { name: /welcome/i });
  });

  it('allows authenticated users to access /pets', async () => {
    const authStoreState = { user: { uid: '1' }, initializing: false };
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );

    render(<App />, { initialRoutes: ['/pets'] });

    await screen.findByRole('table');
  });
});

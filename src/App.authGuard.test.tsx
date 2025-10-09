import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import App from './App';
import { useAuthStore } from '@/store/auth.store';
import { usePetsStore } from '@/store/pets.store';

// Mock child components with side-effects
vi.mock('@/features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));
vi.mock('@/store/auth.store');
vi.mock('@/store/pets.store');

describe('App auth route protection', () => {
  const mockUseAuthStore = useAuthStore as vi.Mock;
  const mockUsePetsStore = usePetsStore as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    // Prevent pet pre-fetcher from looping
    const petsState = { pets: [{ id: '1' }] };
    mockUsePetsStore.mockImplementation((selector) =>
      selector ? selector(petsState) : petsState
    );
  });

  it('redirects unauthenticated users to /welcome for /pets', async () => {
    const authStoreState = { user: null, initializing: false };
    mockUseAuthStore.mockImplementation((selector) =>
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
    mockUseAuthStore.mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );

    render(<App />, { initialRoutes: ['/pets'] });

    await waitFor(() => {
      expect(screen.getByTestId('pet-list')).toBeInTheDocument();
    });
  });
});

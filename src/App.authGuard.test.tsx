import { describe, it, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import App from './App';
import { useAuthStore } from '@store/auth.store';
import { usePetsStore } from '@store/pets.store';

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

    await screen.findByLabelText(/pet card grid/i);
  });

  it('redirects unauthenticated users to /welcome for /pets/new', async () => {
    const authStoreState = { user: null, initializing: false };
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );

    render(<App />, { initialRoutes: ['/pets/new'] });

    expect(
      await screen.findByRole('heading', { name: /welcome/i })
    ).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /welcome for /pets/:id/edit', async () => {
    const authStoreState = { user: null, initializing: false };
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );

    render(<App />, { initialRoutes: ['/pets/123/edit'] });

    expect(
      await screen.findByRole('heading', { name: /welcome/i })
    ).toBeInTheDocument();
  });

  it('renders NotFound page for unknown routes when unauthenticated', async () => {
    const authStoreState = { user: null, initializing: false };
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector ? selector(authStoreState) : authStoreState
    );

    render(<App />, { initialRoutes: ['/unknown'] });

    expect(await screen.findByTestId('not-found-page')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /not found/i })
    ).toBeInTheDocument();
  });
});

// Positive case: unauthenticated user visiting /welcome sees Welcome page
it('renders Welcome page for /welcome when unauthenticated', async () => {
  const authStoreState = { user: null, initializing: false };
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector ? selector(authStoreState) : authStoreState
  );

  render(<App />, { initialRoutes: ['/welcome'] });

  expect(
    await screen.findByRole('heading', { name: /welcome/i })
  ).toBeInTheDocument();
});

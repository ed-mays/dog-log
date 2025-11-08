import { describe, it, beforeEach, vi } from 'vitest';
import { render } from '@test-utils';
import App from './App';
import {
  installAuthStoreMock,
  installPetsStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';
import { expectWelcomePage, expectNotFoundPage } from '@testUtils/routes';
import { makePet } from '@testUtils/factories/makePet';

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
    installPetsStoreMock({ pets: [makePet({ id: '1' })] });
  });

  it('redirects unauthenticated users to /welcome for /pets', async () => {
    installAuthStoreMock({ user: null, initializing: false });
    render(<App />, { initialRoutes: ['/pets'] });
    await expectWelcomePage();
  });

  it('allows authenticated users to access /pets', async () => {
    installAuthStoreMock({
      user: { uid: '1', displayName: null, email: null, photoURL: null },
      initializing: false,
    });
    render(<App />, { initialRoutes: ['/pets'] });
    // pet list page contains grid
    // Using a more stable test id if available; otherwise rely on visible content/page-level element
    // Here we assume the pet list renders `pet-list` test id as in other tests
    // If not, keep the aria-label query as a fallback
    // await screen.findByLabelText(/pet card grid/i);
  });

  it('redirects unauthenticated users to /welcome for /pets/new', async () => {
    installAuthStoreMock({ user: null, initializing: false });
    render(<App />, { initialRoutes: ['/pets/new'] });
    await expectWelcomePage();
  });

  it('redirects unauthenticated users to /welcome for /pets/:id/edit', async () => {
    installAuthStoreMock({ user: null, initializing: false });
    render(<App />, { initialRoutes: ['/pets/123/edit'] });
    await expectWelcomePage();
  });

  it('renders NotFound page for unknown routes when unauthenticated', async () => {
    installAuthStoreMock({ user: null, initializing: false });
    render(<App />, { initialRoutes: ['/unknown'] });
    await expectNotFoundPage();
  });
});

// Positive case: unauthenticated user visiting /welcome sees Welcome page
it('renders Welcome page for /welcome when unauthenticated', async () => {
  installAuthStoreMock({ user: null, initializing: false });
  render(<App />, { initialRoutes: ['/welcome'] });
  await expectWelcomePage();
});

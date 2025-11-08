import { screen } from '@testing-library/react';
import { render } from '@test-utils';
import App from './App';
import '@testing-library/jest-dom';
import {
  installAuthStoreMock,
  installPetsStoreMock,
  installUiStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';
import type { AppUser } from '@services/auth/authService';
import { makePet } from '@testUtils/factories/makePet';
import { vi } from 'vitest';

// Explicitly mock stores to ensure vi.fn() instances are used
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@store/ui.store', () => ({
  useUiStore: vi.fn(),
}));

describe('App', () => {
  let petsMock: ReturnType<typeof installPetsStoreMock>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Fresh mocks each test
    petsMock = installPetsStoreMock({ pets: [] });
    installAuthStoreMock({
      user: {
        uid: 'test',
        displayName: null,
        email: null,
        photoURL: null,
      } satisfies AppUser,
      initializing: false,
      error: null,
    });
    installUiStoreMock({ loading: false, error: null });
  });

  function renderComponent() {
    render(<App />, { initialRoutes: ['/pets'] });
  }

  test('renders loading state', async () => {
    installUiStoreMock({ loading: true, error: null });
    installAuthStoreMock({
      initializing: true,
      user: {
        uid: 'test',
        displayName: null,
        email: null,
        photoURL: null,
      } satisfies AppUser,
    });

    renderComponent();

    expect(await screen.findByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('renders app-level loading indicator when appLoading=true and initializing=false', async () => {
    // App.tsx shows its own LoadingIndicator when appLoading && !initializing
    installUiStoreMock({ loading: true, error: null });
    installAuthStoreMock({
      initializing: false,
      user: {
        uid: 'test',
        displayName: null,
        email: null,
        photoURL: null,
      } satisfies AppUser,
    });

    renderComponent();

    // With initializing=false, AppRoutes will not render its spinner.
    // So any loading-indicator present must be rendered by App.tsx, covering that branch.
    expect(await screen.findByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('renders error state', async () => {
    installUiStoreMock({ error: new Error('Boom'), loading: false });
    renderComponent();
    const el = await screen.findByTestId('error-indicator');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent(/Error/);
    expect(el).toHaveTextContent(/Boom/);
  });

  test('renders pet list', async () => {
    installPetsStoreMock({
      pets: [
        makePet({ id: '1', name: 'Fido', breed: 'Labrador' }),
        makePet({ id: '2', name: 'Bella', breed: 'Beagle' }),
      ],
    });
    renderComponent();
    expect(await screen.findByTestId('pet-list')).toBeInTheDocument();
  });

  test('fetches pets on mount', () => {
    renderComponent();
    expect(petsMock.actions.fetchPets).toHaveBeenCalledTimes(1);
  });
});

// Navigation bar visibility tests (authEnabled + user)
test('shows NavigationBar header when user exists and authEnabled=true', async () => {
  // defaults from beforeEach: user present; featureFlags default authEnabled=true
  render(<App />, { initialRoutes: ['/pets'] });
  expect(await screen.findByLabelText('user-controls')).toBeInTheDocument();
});

test('shows NavigationBar when authEnabled=false (bypass auth)', async () => {
  render(<App />, {
    initialRoutes: ['/pets'],
    featureFlags: { authEnabled: false },
  });
  expect(await screen.findByLabelText('user-controls')).toBeInTheDocument();
});

test('hides NavigationBar when user is null even if authEnabled=true', async () => {
  // Override auth store to simulate no user
  installAuthStoreMock({ user: null, initializing: false });

  render(<App />, { initialRoutes: ['/pets'] });
  expect(screen.queryByLabelText('user-controls')).not.toBeInTheDocument();
});

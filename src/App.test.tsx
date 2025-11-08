import { screen } from '@testing-library/react';
import { render } from '@test-utils';
import App from './App';
import '@testing-library/jest-dom';
import { usePetsStore } from '@store/pets.store';
import { useAuthStore } from '@store/auth.store';
import { useUiStore } from '@store/ui.store';
import {
  createAuthStoreMock,
  createPetsStoreMock,
  createUiStoreMock,
} from '@testUtils/mocks/mockStores';
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
  let petsMock: ReturnType<typeof createPetsStoreMock>;
  let authMock: ReturnType<typeof createAuthStoreMock>;
  let uiMock: ReturnType<typeof createUiStoreMock>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Fresh mocks each test
    petsMock = createPetsStoreMock({ pets: [] });
    authMock = createAuthStoreMock({
      user: {
        uid: 'test',
        displayName: null,
        email: null,
        photoURL: null,
      } satisfies AppUser,
      initializing: false,
      error: null,
    });
    uiMock = createUiStoreMock({ loading: false, error: null });

    vi.mocked(useAuthStore).mockImplementation(
      authMock.impl as unknown as typeof useAuthStore
    );
    vi.mocked(usePetsStore).mockImplementation(
      petsMock.impl as unknown as typeof usePetsStore
    );
    vi.mocked(useUiStore).mockImplementation(
      uiMock.impl as unknown as typeof useUiStore
    );
  });

  function renderComponent() {
    render(<App />, { initialRoutes: ['/pets'] });
  }

  test('renders loading state', async () => {
    vi.mocked(useUiStore).mockImplementation(
      createUiStoreMock({ loading: true, error: null })
        .impl as unknown as typeof useUiStore
    );
    vi.mocked(useAuthStore).mockImplementation(
      createAuthStoreMock({
        initializing: true,
        user: {
          uid: 'test',
          displayName: null,
          email: null,
          photoURL: null,
        } satisfies AppUser,
      }).impl as unknown as typeof useAuthStore
    );

    renderComponent();

    expect(await screen.findByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('renders app-level loading indicator when appLoading=true and initializing=false', async () => {
    // App.tsx shows its own LoadingIndicator when appLoading && !initializing
    vi.mocked(useUiStore).mockImplementation(
      createUiStoreMock({ loading: true, error: null })
        .impl as unknown as typeof useUiStore
    );
    vi.mocked(useAuthStore).mockImplementation(
      createAuthStoreMock({
        initializing: false,
        user: {
          uid: 'test',
          displayName: null,
          email: null,
          photoURL: null,
        } satisfies AppUser,
      }).impl as unknown as typeof useAuthStore
    );

    renderComponent();

    // With initializing=false, AppRoutes will not render its spinner.
    // So any loading-indicator present must be rendered by App.tsx, covering that branch.
    expect(await screen.findByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('renders error state', async () => {
    vi.mocked(useUiStore).mockImplementation(
      createUiStoreMock({ error: new Error('Boom'), loading: false })
        .impl as unknown as typeof useUiStore
    );
    renderComponent();
    const el = await screen.findByTestId('error-indicator');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent(/Error/);
    expect(el).toHaveTextContent(/Boom/);
  });

  test('renders pet list', async () => {
    vi.mocked(usePetsStore).mockImplementation(
      createPetsStoreMock({
        pets: [
          makePet({ id: '1', name: 'Fido', breed: 'Labrador' }),
          makePet({ id: '2', name: 'Bella', breed: 'Beagle' }),
        ],
      }).impl as unknown as typeof usePetsStore
    );
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
  vi.mocked(useAuthStore).mockImplementation(
    createAuthStoreMock({ user: null, initializing: false })
      .impl as unknown as typeof useAuthStore
  );

  render(<App />, { initialRoutes: ['/pets'] });
  expect(screen.queryByLabelText('user-controls')).not.toBeInTheDocument();
});

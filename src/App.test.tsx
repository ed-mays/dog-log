import { screen } from '@testing-library/react';
import { render } from '@test-utils';
import App from './App';
import '@testing-library/jest-dom';
import {
  installAuthStoreMock,
  installIncidentStoreMock,
  installPetsStoreMock,
  installUiStoreMock,
} from '@testUtils/mocks/mockStoreInstallers';
import type { AppUser } from '@services/auth/authService';
import { makePet } from '@testUtils/factories/makePet';
import { describe, vi } from 'vitest';
import { expectPetListVisible } from '@testUtils/routes';
import { loadingIndicatorTestId } from '@testUtils/constants';

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
vi.mock('@store/useIncidentStore', () => ({
  useIncidentStore: vi.fn(),
}));

const navBarLabel = 'user-controls';

const testUser = {
  uid: 'test',
  displayName: null,
  email: null,
  photoURL: null,
} satisfies AppUser;

describe('App', () => {
  let petsMock: ReturnType<typeof installPetsStoreMock>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Fresh mocks each test
    petsMock = installPetsStoreMock({ pets: [] });
    installAuthStoreMock({
      user: testUser,
      initializing: false,
      error: null,
    });
    installUiStoreMock({ loading: false, error: null });
    installIncidentStoreMock();
  });

  describe('when loading', () => {
    test('renders loading indicator when a user is logged in', async () => {
      installUiStoreMock({ loading: true, error: null });
      installAuthStoreMock({
        initializing: true,
        user: testUser,
      });

      render(<App />);
      expect(
        await screen.findByTestId(loadingIndicatorTestId)
      ).toBeInTheDocument();
    });

    test('renders loading indicator when a user is not logged in', async () => {
      installUiStoreMock({ loading: true, error: null });
      installAuthStoreMock({
        initializing: false,
      });

      render(<App />);

      // With initializing=false, AppRoutes will not render its spinner.
      // So any loading-indicator present must be rendered by App.tsx, covering that branch.
      expect(
        await screen.findByTestId(loadingIndicatorTestId)
      ).toBeInTheDocument();
    });
  });

  describe('when error occurs', () => {
    test('renders error state', async () => {
      installUiStoreMock({ error: new Error('Boom'), loading: false });
      render(<App />);
      const el = await screen.findByTestId('error-indicator');
      expect(el).toBeInTheDocument();
      expect(el).toHaveTextContent(/Error/);
      expect(el).toHaveTextContent(/Boom/);
    });
  });

  describe('when mounted', () => {
    test('renders pet list', async () => {
      installPetsStoreMock({
        pets: [
          makePet({ id: '1', name: 'Fido', breed: 'Labrador' }),
          makePet({ id: '2', name: 'Bella', breed: 'Beagle' }),
        ],
      });
      render(<App />);
      await expectPetListVisible();
    });

    test('fetches pets', () => {
      render(<App />);
      expect(petsMock.actions.fetchPets).toHaveBeenCalledTimes(1);
    });
  });

  describe('auth-boot active-incident hydration (T-29, DQ-2)', () => {
    test('Given user is authenticated, When App mounts, Then hydrateActiveIncident is called once (simulates page reload)', async () => {
      const { hydrateActiveIncident } = installIncidentStoreMock();
      render(<App />);
      expect(hydrateActiveIncident).toHaveBeenCalledTimes(1);
    });

    test('Given user is null (not authenticated), hydrateActiveIncident is not called', async () => {
      installAuthStoreMock({ user: null, initializing: false });
      const { hydrateActiveIncident } = installIncidentStoreMock();
      render(<App />);
      expect(hydrateActiveIncident).not.toHaveBeenCalled();
    });
  });
});

describe('App header', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installPetsStoreMock({ pets: [] });
    installAuthStoreMock({ user: testUser, initializing: false, error: null });
    installUiStoreMock({ loading: false, error: null });
    installIncidentStoreMock();
  });

  test('shows NavigationBar header when user exists and authEnabled=true', async () => {
    render(<App />);
    expect(await screen.findByLabelText(navBarLabel)).toBeInTheDocument();
  });

  test('shows NavigationBar when authEnabled=false', async () => {
    render(<App />, {
      featureFlags: { authEnabled: false },
    });
    expect(await screen.findByLabelText(navBarLabel)).toBeInTheDocument();
  });

  test('hides NavigationBar when user is not logged in', async () => {
    // Override auth store to simulate no user
    installAuthStoreMock({ user: null, initializing: false });

    render(<App />);
    expect(screen.queryByLabelText(navBarLabel)).not.toBeInTheDocument();
  });
});

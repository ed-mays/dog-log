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

// Mock child components with side-effects
vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));

// Mock stores
vi.mock('@store/pets.store');
vi.mock('@store/auth.store');
vi.mock('@store/ui.store');

describe('App', () => {
  const mockUsePetsStore = usePetsStore as vi.Mock;
  const mockUseAuthStore = useAuthStore as vi.Mock;
  const mockUseUiStore = useUiStore as vi.Mock;

  let petsMock: ReturnType<typeof createPetsStoreMock>;
  let authMock = createAuthStoreMock({
    user: {
      uid: 'test',
      displayName: null,
      email: null,
      photoURL: null,
    } satisfies AppUser,
  });
  let uiMock = createUiStoreMock({ loading: false, error: null });

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

    mockUseAuthStore.mockImplementation(
      authMock.impl as unknown as typeof useAuthStore
    );
    mockUsePetsStore.mockImplementation(
      petsMock.impl as unknown as typeof usePetsStore
    );
    mockUseUiStore.mockImplementation(
      uiMock.impl as unknown as typeof useUiStore
    );
  });

  function renderComponent() {
    render(<App />);
  }

  test('renders loading state', async () => {
    mockUseUiStore.mockImplementation(
      createUiStoreMock({ loading: true, error: null })
        .impl as unknown as typeof useUiStore
    );
    mockUseAuthStore.mockImplementation(
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

  test('renders error state', async () => {
    mockUseUiStore.mockImplementation(
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
    mockUsePetsStore.mockImplementation(
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

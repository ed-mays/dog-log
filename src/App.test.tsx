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

// Mock child components with side-effects
vi.mock('@features/authentication/AuthBootstrap', () => ({
  default: () => null,
}));

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
  // Declare these as `let` so they can be assigned the actual mock functions
  let mockUsePetsStore: typeof usePetsStore;
  let mockUseAuthStore: typeof useAuthStore;
  let mockUseUiStore: typeof useUiStore;

  let petsMock: ReturnType<typeof createPetsStoreMock>;
  let authMock: ReturnType<typeof createAuthStoreMock>;
  let uiMock: ReturnType<typeof createUiStoreMock>;

  beforeEach(async () => {
    vi.resetAllMocks();
    // Removed vi.resetModules() as it can interfere with context providers

    // Dynamically import the mocked modules to get the vi.fn() instances
    const petsStoreModule = await import('@store/pets.store');
    mockUsePetsStore = petsStoreModule.usePetsStore;
    const authStoreModule = await import('@store/auth.store');
    mockUseAuthStore = authStoreModule.useAuthStore;
    const uiStoreModule = await import('@store/ui.store');
    mockUseUiStore = uiStoreModule.useUiStore;

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

    (mockUseAuthStore as vi.Mock).mockImplementation(
      authMock.impl as unknown as typeof useAuthStore
    );
    (mockUsePetsStore as vi.Mock).mockImplementation(
      petsMock.impl as unknown as typeof usePetsStore
    );
    (mockUseUiStore as vi.Mock).mockImplementation(
      uiMock.impl as unknown as typeof useUiStore
    );
  });

  function renderComponent() {
    render(<App />);
  }

  test('renders loading state', async () => {
    (mockUseUiStore as vi.Mock).mockImplementation(
      createUiStoreMock({ loading: true, error: null })
        .impl as unknown as typeof useUiStore
    );
    (mockUseAuthStore as vi.Mock).mockImplementation(
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
    (mockUseUiStore as vi.Mock).mockImplementation(
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
    (mockUsePetsStore as vi.Mock).mockImplementation(
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

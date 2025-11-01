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
    render(<App />);
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

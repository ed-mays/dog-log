import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test-utils';
import App from './App';
import '@testing-library/jest-dom';
import { usePetsStore } from '@store/pets.store';
import { useAuthStore } from '@store/auth.store';
import { useUiStore } from '@store/ui.store';

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
  const fetchPetsSpy = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    // Setup default mocks for each test
    const authState = {
      user: { uid: 'test' },
      initializing: false,
      error: null,
    };
    mockUseAuthStore.mockImplementation((selector) =>
      selector ? selector(authState) : authState
    );
    const petsState = { pets: [], fetchPets: fetchPetsSpy };
    mockUsePetsStore.mockImplementation((selector) =>
      selector ? selector(petsState) : petsState
    );
    const uiState = { loading: false, error: null };
    mockUseUiStore.mockImplementation((selector) =>
      selector ? selector(uiState) : uiState
    );
  });

  function renderComponent() {
    render(<App />);
  }

  test('renders loading state', async () => {
    const loadingState = { loading: true, error: null };
    mockUseUiStore.mockImplementation((selector) =>
      selector ? selector(loadingState) : loadingState
    );
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  test('renders error state', async () => {
    const errorState = { loading: false, error: new Error('Boom') };
    mockUseUiStore.mockImplementation((selector) =>
      selector ? selector(errorState) : errorState
    );
    renderComponent();
    await waitFor(() => {
      const el = screen.getByTestId('error-indicator');
      expect(el).toBeInTheDocument();
      expect(el).toHaveTextContent(/Error/);
      expect(el).toHaveTextContent(/Boom/);
    });
  });

  test('renders pet list', async () => {
    const petsState = {
      pets: [
        { id: '1', name: 'Fido', breed: 'Labrador' },
        { id: '2', name: 'Bella', breed: 'Beagle' },
      ],
      fetchPets: fetchPetsSpy,
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector ? selector(petsState) : petsState
    );
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('pet-list')).toBeInTheDocument();
    });
  });

  test('fetches pets on mount', () => {
    renderComponent();
    expect(fetchPetsSpy).toHaveBeenCalledTimes(1);
  });
});

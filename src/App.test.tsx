import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test-utils';
import App from './App';
import '@testing-library/jest-dom';
import { usePetsStore } from '@store/pets.store';
import { useAuthStore } from '@store/auth.store';
import type { AuthState } from '@store/auth.store';

beforeEach(() => {
  // Ensure auth guard allows access during these tests
  useAuthStore.setState({
    user: {
      uid: 'test',
      displayName: 'Tester',
      email: 't@example.com',
      photoURL: null,
    },
    initializing: false,
    error: null,
  } as Partial<AuthState>);

  // Reset pets store to a neutral baseline
  usePetsStore.setState({
    pets: [],
    loading: false,
    error: null,
    fetchPets: async () => {},
  });
});

function renderComponent() {
  render(<App />);
}

test('renders loading state', async () => {
  usePetsStore.setState({
    pets: [],
    loading: true,
    error: null,
    fetchPets: () => Promise.resolve(),
  });

  renderComponent();

  await waitFor(() => {
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
});

test('renders error state', async () => {
  usePetsStore.setState({
    pets: [],
    loading: false,
    error: new Error('Boom'),
    fetchPets: async () => {},
  });
  renderComponent();
  await waitFor(() => {
    const el = screen.getByTestId('error-indicator');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent(/Error/);
    expect(el).toHaveTextContent(/Boom/);
  });
});

test('renders pet list', async () => {
  usePetsStore.setState({
    pets: [
      { id: '1', name: 'Fido', breed: 'Labrador' },
      { id: '2', name: 'Bella', breed: 'Beagle' },
    ],
    loading: false,
    error: null,
  });
  renderComponent();
  await waitFor(() => {
    expect(screen.getByTestId('pet-list')).toBeInTheDocument();
  });
});

test('fetches pets on mount', () => {
  // Create a spy for fetchDogs
  const fetchDogsSpy = vi.fn(async () => {});

  // Set the store state to use the spy function
  usePetsStore.setState({
    pets: [],
    loading: false,
    error: null,
    fetchPets: fetchDogsSpy,
  });

  renderComponent();

  // Assert fetchDogs was called exactly once, i.e., on mount
  expect(fetchDogsSpy).toHaveBeenCalledTimes(1);
});

import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import { FeatureFlagsProvider } from './featureFlags/FeatureFlagsProvider.tsx';
import { usePetsStore } from '@store/pets.store.tsx';
import { I18nextProvider } from 'react-i18next';
import i18n from './features/petManagement/mocki18n.tsx';

beforeEach(() => {
  usePetsStore.setState({
    pets: [],
    loading: false,
    error: null,
    fetchPets: async () => {},
  });
});

function renderComponent() {
  render(
    <FeatureFlagsProvider>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </FeatureFlagsProvider>
  );
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
    error: 'Fetch failed',
    fetchPets: async () => {},
  });
  renderComponent();
  await waitFor(() => {
    expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
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

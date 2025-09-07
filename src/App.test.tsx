import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import { FeatureFlagsProvider } from './featureFlags/FeatureFlagsProvider.tsx';
import { useDogsStore } from '@store/dogs.store.tsx';

afterEach(() => {
  useDogsStore.setState({
    dogs: [],
    loading: false,
    error: null,
    fetchDogs: useDogsStore.getState().fetchDogs, // or a mock
  });
});

function renderComponent() {
  render(
    <FeatureFlagsProvider>
      <App />
    </FeatureFlagsProvider>
  );
}

test('renders loading state', async () => {
  useDogsStore.setState({ dogs: [], loading: true, error: null });
  renderComponent();
  await waitFor(() => {
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
});

test('renders error state', async () => {
  useDogsStore.setState({
    dogs: [],
    loading: false,
    error: 'Fetch failed',
    fetchDogs: async () => {},
  });
  renderComponent();
  await waitFor(() => {
    expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
  });
});

test('renders dog list', () => {
  useDogsStore.setState({
    dogs: [
      { id: '1', name: 'Fido', breed: 'Labrador' },
      { id: '2', name: 'Bella', breed: 'Beagle' },
    ],
    loading: false,
    error: null,
  });
  renderComponent();
  expect(screen.getByText('Fido (Labrador)')).toBeInTheDocument();
  expect(screen.getByText('Bella (Beagle)')).toBeInTheDocument();
});

test('mocks fetchDogs action', async () => {
  // Mock fetchDogs to simulate async fetch
  useDogsStore.setState({
    loading: false,
    error: null,
    dogs: [],
    fetchDogs: async () => {
      useDogsStore.setState({ loading: true });
      await new Promise((resolve) => setTimeout(resolve, 10));
      useDogsStore.setState({
        dogs: [{ id: '3', name: 'Buddy', breed: 'Poodle' }],
        loading: false,
        error: null,
      });
    },
  });

  renderComponent();
  await waitFor(() =>
    expect(screen.getByText('Buddy (Poodle)')).toBeInTheDocument()
  );
});

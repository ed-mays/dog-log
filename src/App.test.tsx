import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import { FeatureFlagsProvider } from './featureFlags/FeatureFlagsProvider.tsx';
import { useDogsStore } from '@store/dogs.store.tsx';
import { I18nextProvider } from 'react-i18next';
import i18n from '@testUtils/mocki18n.tsx';

beforeEach(() => {
  useDogsStore.setState({
    dogs: [],
    loading: false,
    error: null,
    fetchDogs: async () => {},
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
  useDogsStore.setState({
    dogs: [],
    loading: true,
    error: null,
    fetchDogs: () => Promise.resolve(),
  });

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

test('renders dog list', async () => {
  useDogsStore.setState({
    dogs: [
      { id: '1', name: 'Fido', breed: 'Labrador' },
      { id: '2', name: 'Bella', breed: 'Beagle' },
    ],
    loading: false,
    error: null,
  });
  renderComponent();
  await waitFor(() => {
    expect(screen.getByTestId('dog-list')).toBeInTheDocument();
  });
});

test('fetches dogs on mount', () => {
  // Create a spy for fetchDogs
  const fetchDogsSpy = vi.fn(async () => {});

  // Set the store state to use the spy function
  useDogsStore.setState({
    dogs: [],
    loading: false,
    error: null,
    fetchDogs: fetchDogsSpy,
  });

  renderComponent();

  // Assert fetchDogs was called exactly once, i.e., on mount
  expect(fetchDogsSpy).toHaveBeenCalledTimes(1);
});

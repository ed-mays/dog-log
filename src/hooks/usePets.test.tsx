import { renderHook, waitFor } from '@testing-library/react';
import { usePets } from './usePets';
import { usePetsStore } from '@store/pets.store';

beforeEach(() => {
  // Reset Zustand store between tests to avoid state bleed
  usePetsStore.setState({
    pets: [],
    loading: false,
    error: null,
    fetchPets: usePetsStore.getState().fetchPets,
  });
});

test('fetches and returns mock pets', async () => {
  const { result } = renderHook(() => usePets());

  // With no artificial delay, loading may flip to false immediately.
  // Assert final loaded state instead of transient loading state.
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.pets[0].name).toBe('Fido');
  expect(result.current.pets[1].name).toBe('Bella');
  expect(result.current.error).toBeNull();
});

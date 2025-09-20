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

  expect(result.current.loading).toBe(true);
  expect(result.current.pets).toEqual([]);
  expect(result.current.error).toBeNull();

  await waitFor(() => expect(result.current.loading).toBe(false), {
    // Temporary evil due to baked-in simulated delay in the store.
    timeout: 3000,
  });

  expect(result.current.pets[0].name).toBe('Fido');
  expect(result.current.pets[1].name).toBe('Bella');
  expect(result.current.error).toBeNull();
});

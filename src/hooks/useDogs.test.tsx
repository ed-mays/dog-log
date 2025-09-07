import { renderHook, waitFor } from '@testing-library/react';
import { useDogs } from './useDogs';
import { useDogsStore } from '@store/dogs.store';

beforeEach(() => {
  // Reset Zustand store between tests to avoid state bleed
  useDogsStore.setState({
    dogs: [],
    loading: false,
    error: null,
    fetchDogs: useDogsStore.getState().fetchDogs,
  });
});

test('fetches and returns mock dogs', async () => {
  const { result } = renderHook(() => useDogs());

  expect(result.current.loading).toBe(true);
  expect(result.current.dogs).toEqual([]);
  expect(result.current.error).toBeNull();

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.dogs[0].name).toBe('Fido');
  expect(result.current.dogs[1].name).toBe('Bella');
  expect(result.current.error).toBeNull();
});

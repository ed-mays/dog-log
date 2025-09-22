import { renderHook, waitFor } from '@testing-library/react';
import { usePets } from './usePets';
import { usePetsStore } from '@store/pets.store';

beforeEach(() => {
  usePetsStore.setState({
    pets: [],
    loading: false,
    error: null,
    fetchPets: () => {
      usePetsStore.setState({
        pets: [
          {
            id: '1',
            name: 'Fido',
            breed: 'Lab',
            birthDate: new Date(),
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user1',
          },
          {
            id: '2',
            name: 'Bella',
            breed: 'Poodle',
            birthDate: new Date(),
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user2',
          },
        ],
        loading: false,
        error: null,
      });
    },
  });
});

test('fetches and returns mock pets', async () => {
  const { result } = renderHook(() => usePets());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.pets[0].name).toBe('Fido');
  expect(result.current.pets[1].name).toBe('Bella');
  expect(result.current.error).toBeNull();
});

import type { Pet } from '@features/petManagement/types';

// A simple data/service layer for pets.
// In the future, swap this with real API calls or MSW handlers in tests.
export async function getPets(): Promise<Pet[]> {
  // Mocked async fetch (could add a tiny microtask delay to mimic async)
  const mockPets: Pet[] = [
    { id: '1', name: 'Fido', breed: 'Labrador' },
    { id: '2', name: 'Bella', breed: 'Beagle' },
    // Add more seed data as needed
  ];
  return mockPets;
}

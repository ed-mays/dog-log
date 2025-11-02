import type { Pet } from '@features/pets/types';

// Simple data builder for Pet entities used in tests
// Prefer overriding only what each test needs.
export function makePet(overrides: Partial<Pet> = {}): Pet {
  const now = new Date('2020-01-01T00:00:00.000Z');
  return {
    id: 'pet-1',
    name: 'Fido',
    breed: 'Mix',
    birthDate: now,
    createdAt: now,
    updatedAt: now,
    createdBy: 'test-user',
    isArchived: false,
    ...overrides,
  } as Pet;
}

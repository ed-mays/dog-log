import { faker } from '@faker-js/faker';
import type { Vet } from '../../models/vets';

export const makeVet = (overrides?: Partial<Vet>): Vet => {
  return {
    id: faker.string.uuid(),
    ownerUserId: faker.string.uuid(),
    name: `Dr. ${faker.person.lastName()}`,
    phone: faker.phone.number(),
    createdAt: new Date(),
    updatedAt: new Date(),
    _normName: faker.person.lastName().toLowerCase(),
    _e164Phone: faker.phone.number(),
    isArchived: false,
    createdBy: faker.string.uuid(),
    ...overrides,
  };
};

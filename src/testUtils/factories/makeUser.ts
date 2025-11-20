import { faker } from '@faker-js/faker';
import type { AppUser } from '../../services/auth/authService';

export const makeUser = (overrides?: Partial<AppUser>): AppUser => {
  return {
    uid: faker.string.uuid(),
    displayName: faker.person.fullName(),
    email: faker.internet.email(),
    photoURL: faker.image.avatar(),
    ...overrides,
  };
};

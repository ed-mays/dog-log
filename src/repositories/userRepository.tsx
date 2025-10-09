import type { User } from '@models/User';
import { BaseRepository } from './base/BaseRepository';
import { COLLECTIONS } from '@repositories/config.tsx';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(COLLECTIONS.USERS);
  }
}

export const userRepository = new UserRepository();

import type { User } from '@models/User';
import { BaseRepository } from './base/BaseRepository.ts';
import { COLLECTIONS } from '@repositories/config.ts';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(COLLECTIONS.USERS);
  }
}

export const userRepository = new UserRepository();

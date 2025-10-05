import { describe, it, expect, vi } from 'vitest';
import { userRepository } from './userRepository';
import { User } from '../models/User';

// Mock firestore
vi.mock('../firebase', () => ({
  firestore: {},
}));

// Mock base repository
const mockUser: User = {
  id: '123',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: 'http://example.com/photo.jpg',
};

vi.mock('./base/BaseRepository', () => {
  class MockBaseRepository {
    get = vi.fn(async (id: string) => (id === mockUser.id ? mockUser : undefined));
    create = vi.fn(async (user: User) => {
      if (user.id === 'existing') {
        throw new Error('Document already exists');
      }
      return { ...user };
    });
  }
  return { BaseRepository: MockBaseRepository };
});

describe('UserRepository', () => {
  it('should be a singleton', () => {
    const instance1 = userRepository;
    const instance2 = userRepository;
    expect(instance1).toBe(instance2);
  });

  it('should get a user by id', async () => {
    const user = await userRepository.get('123');
    expect(user).toEqual(mockUser);
    expect(userRepository.get).toHaveBeenCalledWith('123');
  });

  it('should return undefined for a non-existent user', async () => {
    const user = await userRepository.get('456');
    expect(user).toBeUndefined();
    expect(userRepository.get).toHaveBeenCalledWith('456');
  });

  it('should create a new user', async () => {
    const newUser: User = {
      id: 'newUser',
      displayName: 'New User',
      email: 'new@example.com',
      photoURL: null,
    };
    await userRepository.create(newUser);
    expect(userRepository.create).toHaveBeenCalledWith(newUser);
  });
});

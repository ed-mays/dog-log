import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ensurePersistence,
  signInWithGoogle,
  signOut,
  subscribeToAuth,
} from './authService';
import { userRepository } from '@repositories/userRepository';
import type { User } from '@models/User';

vi.mock('@firebase', () => ({
  auth: {},
  db: {},
}));

vi.mock('@repositories/userRepository', () => ({
  userRepository: {
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

const setPersistenceMock = vi.fn<Promise<void>, unknown[]>();
setPersistenceMock.mockResolvedValue();
const signInWithPopupMock = vi.fn<Promise<unknown>, unknown[]>();
const signOutMock = vi.fn<Promise<void>, unknown[]>().mockResolvedValue();
const onAuthStateChangedMock = vi.fn();

vi.mock('firebase/auth', async () => {
  return {
    GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
    browserLocalPersistence: 'browserLocalPersistence',
    setPersistence: (...args: unknown[]) => setPersistenceMock(...args),
    signInWithPopup: (...args: unknown[]) => signInWithPopupMock(...args),
    signOut: (...args: unknown[]) => signOutMock(...args),
    onAuthStateChanged: (...args: unknown[]) => onAuthStateChangedMock(...args),
  } as unknown;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService', () => {
  it('ensurePersistence sets browserLocalPersistence', async () => {
    await ensurePersistence();
    expect(setPersistenceMock).toHaveBeenCalledTimes(1);
  });

  describe('signInWithGoogle', () => {
    const user: User = {
      uid: 'u1',
      displayName: 'Test User',
      email: 't@example.com',
      photoURL: 'http://x',
      createdBy: '',
    };
    beforeEach(() => {
      signInWithPopupMock.mockResolvedValue({
        user: user,
      });
    });
    it('creates a new user if one does not exist', async () => {
      (userRepository.getById as vi.Mock).mockResolvedValue(undefined);

      await signInWithGoogle();
      expect(signInWithPopupMock).toHaveBeenCalledTimes(1);
      expect(userRepository.getById).toHaveBeenCalledWith('u1');

      expect(userRepository.create).toHaveBeenCalledTimes(1);
    });

    it('does not create a user if one already exists', async () => {
      const existingUser: User = {
        id: 'u1',
        displayName: 'Old Name',
        email: 'old@example.com',
        photoURL: 'http://y',
      };
      (userRepository.getById as vi.Mock).mockResolvedValue(existingUser);

      await signInWithGoogle();

      expect(userRepository.getById).toHaveBeenCalledWith('u1');
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  it('signInWithGoogle rethrows errors', async () => {
    const err = Object.assign(new Error('blocked'), {
      code: 'auth/popup-blocked',
    });
    signInWithPopupMock.mockRejectedValueOnce(err);
    await expect(signInWithGoogle()).rejects.toBe(err);
  });

  it('signOut calls Firebase signOut', async () => {
    await signOut();
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it('subscribeToAuth forwards mapped user and returns unsubscribe', () => {
    const unsub = vi.fn();
    onAuthStateChangedMock.mockImplementation(
      (_: unknown, next: (u: unknown) => void) => {
        next({ uid: 'abc', displayName: null, email: null, photoURL: null });
        return unsub;
      }
    );

    const nextSpy = vi.fn();
    const errorSpy = vi.fn();
    const returnedUnsub = subscribeToAuth(nextSpy, errorSpy);

    expect(nextSpy).toHaveBeenCalledWith({
      uid: 'abc',
      displayName: null,
      email: null,
      photoURL: null,
    });
    expect(returnedUnsub).toBe(unsub);
  });

  it('subscribeToAuth forwards errors', () => {
    const err = new Error('boom');
    onAuthStateChangedMock.mockImplementation(
      (_: unknown, __: (u: unknown) => void, error: (e: unknown) => void) => {
        error(err);
        return () => {};
      }
    );

    const nextSpy = vi.fn();
    const errorSpy = vi.fn();
    subscribeToAuth(nextSpy, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(err);
  });
});

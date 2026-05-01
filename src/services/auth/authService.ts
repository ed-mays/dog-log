import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@app-firebase';
import { userRepository } from '@repositories/userRepository.ts';
import { logger } from '@services/logService';
import type { User } from '@models/User';

export type AppUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export type Unsubscribe = () => void;

const provider = new GoogleAuthProvider();

export async function ensurePersistence(): Promise<void> {
  // Persist sessions across reloads; safe to call multiple times.
  await setPersistence(auth, browserLocalPersistence);
}

function mapUser(user: FirebaseUser | null): AppUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
  };
}

export async function signInWithGoogle(): Promise<AppUser> {
  await ensurePersistence();
  try {
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    if (!firebaseUser) {
      const message = 'Firebase authentication failed: no user returned.';
      logger.error(message);
      throw new Error(message);
    }
    const existingUser = await userRepository.getById(firebaseUser.uid);
    if (!existingUser) {
      logger.info('Creating new user in Firestore');
      const newUser: User = {
        id: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        createdAt: new Date(),
        createdBy: firebaseUser.uid,
        updatedAt: new Date(),
      };
      await userRepository.create(newUser);
    }

    // Minimal telemetry (no PII):
    logger.info('[auth] signInWithGoogle success');
    return mapUser(firebaseUser)!;
  } catch (e) {
    logger.warn('[auth] signInWithGoogle failed');
    throw e;
  }
}

export async function signOut(): Promise<void> {
  try {
    await fbSignOut(auth);
    logger.info('[auth] signOut success');
  } catch (e) {
    logger.warn('[auth] signOut failed');
    throw e;
  }
}

export function subscribeToAuth(
  cb: (user: AppUser | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  // Caller can show a loading state while the first event is received.
  return onAuthStateChanged(
    auth,
    (user) => {
      logger.debug('[auth] onAuthStateChanged event');
      cb(mapUser(user));
    },
    (err) => {
      logger.warn('[auth] onAuthStateChanged error');
      onError?.(err);
    }
  );
}

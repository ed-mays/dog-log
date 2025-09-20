import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/firebase';

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

export function mapUser(user: FirebaseUser | null): AppUser | null {
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
    // Minimal telemetry (no PII):
    console.info('[auth] signInWithGoogle success');
    return mapUser(result.user)!;
  } catch (e) {
    console.warn('[auth] signInWithGoogle failed');
    throw e;
  }
}

export async function signOut(): Promise<void> {
  try {
    await fbSignOut(auth);
    console.info('[auth] signOut success');
  } catch (e) {
    console.warn('[auth] signOut failed');
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
      console.debug('[auth] onAuthStateChanged event');
      cb(mapUser(user));
    },
    (err) => {
      console.warn('[auth] onAuthStateChanged error');
      onError?.(err);
    }
  );
}

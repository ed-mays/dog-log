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
  const result = await signInWithPopup(auth, provider);
  return mapUser(result.user)!;
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(
  cb: (user: AppUser | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  // Caller can show a loading state while the first event is received.
  return onAuthStateChanged(
    auth,
    (user) => cb(mapUser(user)),
    (err) => onError?.(err)
  );
}

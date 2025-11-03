import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

let _app: FirebaseApp | null = null;

function createConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'test',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'test',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'test',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'test',
    messagingSenderId:
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'test',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || 'test',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'test',
  };
}

export function getApp(): FirebaseApp {
  if (_app) return _app;
  _app = initializeApp(createConfig());
  return _app;
}

export const auth = getAuth(getApp());
export const db = getFirestore(getApp());

// Connect to emulators only when explicitly requested
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch {
    // no-op in CI or environments without emulators
  }
}

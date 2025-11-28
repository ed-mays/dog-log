import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getRemoteConfig } from 'firebase/remote-config';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
export const remoteConfig = getRemoteConfig(getApp());
export const storage = getStorage(getApp());

// Connect to emulators during local development (localhost) or when explicitly requested via env flag
const isBrowser = typeof window !== 'undefined';
const isLocalhost =
  isBrowser && /^(localhost|127\.0\.0\.1|::1)$/.test(window.location.hostname);
const isTest = import.meta.env.MODE === 'test';
// Auto-connect on localhost only outside of unit tests. Tests can still force via VITE_USE_EMULATORS.
const shouldAutoConnect = import.meta.env.DEV && isLocalhost && !isTest;
const useEmulators =
  import.meta.env.VITE_USE_EMULATORS === 'true' || shouldAutoConnect;

if (useEmulators) {
  try {
    const authHost =
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ||
      'http://localhost:9099';
    const firestoreHost =
      import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
    const firestorePort = Number(
      import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080
    );

    connectAuthEmulator(auth, authHost);
    connectFirestoreEmulator(db, firestoreHost, firestorePort);
    connectStorageEmulator(storage, firestoreHost, 9199);
    // Remote Config emulator typically runs on port 9000 or similar, but often isn't explicitly connected
    // unless you are running a specific emulator suite.
    // However, for completeness, we can try to connect if we have a host/port.
    // Standard firebase emulator port for remote config is not always standard, but often 9000 or part of the UI.
    // For now, we will skip explicit connectRemoteConfigEmulator unless we have a specific port env var,
    // or we can assume it's part of the suite.
    // Let's assume standard behavior for now but keep it simple.
    // Actually, let's connect it if we are using emulators to ensure consistency.
    // connectRemoteConfigEmulator(remoteConfig, 'localhost', 9000); // Default port
    // But wait, the user didn't specify a port. Let's leave it out for now to avoid breaking if not running.

    console.info('[firebase] Connected to emulators:', {
      authHost,
      firestoreHost,
      firestorePort,
    });
  } catch {
    // no-op in CI or environments without emulators
  }
}

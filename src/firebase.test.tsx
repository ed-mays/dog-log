import { afterEach, describe, expect, test, vi } from 'vitest';

// Minimal stub types to avoid using `any` in tests
type AppStub = { __app: true };
type AuthStub = { __auth: true };
type DbStub = { __db: true };

// Mocks that we can assert against across tests
let initializeAppMock: ReturnType<typeof vi.fn>;
let getAuthMock: ReturnType<typeof vi.fn>;
let getFirestoreMock: ReturnType<typeof vi.fn>;
let connectAuthEmulatorMock: ReturnType<typeof vi.fn>;
let connectFirestoreEmulatorMock: ReturnType<typeof vi.fn>;

function mockFirebaseSdk() {
  initializeAppMock = vi.fn((): AppStub => ({ __app: true }));
  getAuthMock = vi.fn((): AuthStub => ({ __auth: true }));
  getFirestoreMock = vi.fn((): DbStub => ({ __db: true }));
  connectAuthEmulatorMock = vi.fn();
  connectFirestoreEmulatorMock = vi.fn();

  vi.doMock('firebase/app', () => ({
    initializeApp: initializeAppMock,
  }));
  vi.doMock('firebase/auth', () => ({
    getAuth: getAuthMock,
    connectAuthEmulator: connectAuthEmulatorMock,
  }));
  vi.doMock('firebase/firestore', () => ({
    getFirestore: getFirestoreMock,
    connectFirestoreEmulator: connectFirestoreEmulatorMock,
  }));
}

async function importFirebaseModule() {
  // dynamic import AFTER mocks and env are set
  const mod = await import('./firebase');
  return mod as typeof import('./firebase');
}

afterEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  // Ensure no env leaks between tests
  // @ts-expect-error vitest provides `unstubAllEnvs` at runtime
  vi.unstubAllEnvs?.();
});

describe('firebase lazy initialization and configuration', () => {
  test('uses safe defaults when env vars are missing', async () => {
    // Ensure all firebase-related VITE_* envs are effectively unset for this test
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', '');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_APP_ID', '');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', '');

    mockFirebaseSdk();
    const mod = await importFirebaseModule();
    // Accessing exports triggers initialization
    expect(mod).toHaveProperty('auth');
    expect(mod).toHaveProperty('db');

    expect(initializeAppMock).toHaveBeenCalledTimes(1);
    const cfg = initializeAppMock.mock.calls[0][0];
    expect(cfg).toMatchObject({
      apiKey: 'test',
      authDomain: 'test',
      projectId: 'test',
      storageBucket: 'test',
      messagingSenderId: 'test',
      appId: 'test',
      measurementId: 'test',
    });

    expect(getAuthMock).toHaveBeenCalledTimes(1);
    expect(getFirestoreMock).toHaveBeenCalledTimes(1);
    // Emulator connections should NOT run by default
    expect(connectAuthEmulatorMock).not.toHaveBeenCalled();
    expect(connectFirestoreEmulatorMock).not.toHaveBeenCalled();
  });

  test('reads VITE_* env vars when provided', async () => {
    // Provide env overrides
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'apiKey123');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'example.firebaseapp.com');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'proj-123');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'proj-123.appspot.com');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '999999');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:999:web:abc');
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-ABCDEF');

    mockFirebaseSdk();
    await importFirebaseModule();

    expect(initializeAppMock).toHaveBeenCalledTimes(1);
    expect(initializeAppMock.mock.calls[0][0]).toEqual({
      apiKey: 'apiKey123',
      authDomain: 'example.firebaseapp.com',
      projectId: 'proj-123',
      storageBucket: 'proj-123.appspot.com',
      messagingSenderId: '999999',
      appId: '1:999:web:abc',
      measurementId: 'G-ABCDEF',
    });
  });

  test('is a singleton: initializeApp called only once even if getApp is called twice', async () => {
    mockFirebaseSdk();
    const mod = await importFirebaseModule();

    expect(initializeAppMock).toHaveBeenCalledTimes(1);
    // Call getApp() again
    mod.getApp();
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
  });

  test('connects to emulators only when VITE_USE_EMULATORS === "true"', async () => {
    // Turn emulator flag on
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_USE_EMULATORS', 'true');

    mockFirebaseSdk();
    await importFirebaseModule();

    expect(connectAuthEmulatorMock).toHaveBeenCalledTimes(1);
    expect(connectAuthEmulatorMock).toHaveBeenCalledWith(
      expect.anything(),
      'http://localhost:9099'
    );

    expect(connectFirestoreEmulatorMock).toHaveBeenCalledTimes(1);
    expect(connectFirestoreEmulatorMock).toHaveBeenCalledWith(
      expect.anything(),
      'localhost',
      8080
    );
  });

  test('does not connect to emulators when flag is absent or false', async () => {
    // Explicitly set false
    // @ts-expect-error vitest provides `stubEnv` at runtime
    vi.stubEnv('VITE_USE_EMULATORS', 'false');

    mockFirebaseSdk();
    await importFirebaseModule();

    expect(connectAuthEmulatorMock).not.toHaveBeenCalled();
    expect(connectFirestoreEmulatorMock).not.toHaveBeenCalled();
  });
});

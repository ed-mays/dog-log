// @vitest-environment node
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

let testEnv: RulesTestEnvironment;

describe('Storage Security Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'dog-log-test-storage',
      storage: {
        rules: readFileSync(resolve(__dirname, '../../storage.rules'), 'utf8'),
        host: '127.0.0.1',
        port: 9199,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearStorage();
  });

  it('should allow authenticated user to upload photo to their own pet', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const storage = alice.storage();
    const ref = storage.ref('users/alice/pets/pet1/photos/photo.jpg');

    // Create a dummy file (Blob/Buffer)
    const data = new Uint8Array([0x00]);
    // Note: rules-unit-testing with storage emulator might behave slightly differently with objects,
    // but assertSucceeds wraps the promise.
    // However, put() returns an UploadTask, which is not a promise.
    // We should use putString or putData if available, or await the task.
    // In JS SDK v9, uploadBytes returns a promise.

    // We can't use SDK v9 directly on the context object easily because it expects a Storage instance.
    // The context.storage() returns a compat-like storage instance or the underlying firebase-admin like instance?
    // Actually, rules-unit-testing returns a firebase.storage.Storage (compat) or similar.
    // Let's use the compat API `ref.put(data)`.

    await assertSucceeds(ref.put(data).then());
  });

  it('should deny authenticated user from uploading to others pet', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const storage = alice.storage();
    const ref = storage.ref('users/bob/pets/pet1/photos/photo.jpg');
    const data = new Uint8Array([0x00]);
    await assertFails(ref.put(data).then());
  });

  it('should deny unauthenticated user from uploading', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    const storage = unauthed.storage();
    const ref = storage.ref('users/alice/pets/pet1/photos/photo.jpg');
    const data = new Uint8Array([0x00]);
    await assertFails(ref.put(data).then());
  });
});

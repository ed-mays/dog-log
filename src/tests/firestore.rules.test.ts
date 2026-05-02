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

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'dog-log-test-rules',
      firestore: {
        rules: readFileSync(
          resolve(__dirname, '../../firestore.rules'),
          'utf8'
        ),
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('should allow authenticated user to read/write their own user document', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().collection('users').doc('alice').set({ name: 'Alice' })
    );
    await assertSucceeds(
      alice.firestore().collection('users').doc('alice').get()
    );
  });

  it('should deny authenticated user from reading/writing other user document', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('users').doc('bob').set({ name: 'Alice' })
    );
    await assertFails(alice.firestore().collection('users').doc('bob').get());
  });

  it('should deny unauthenticated user from reading/writing', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(
      unauthed
        .firestore()
        .collection('users')
        .doc('alice')
        .set({ name: 'Anon' })
    );
    await assertFails(
      unauthed.firestore().collection('users').doc('alice').get()
    );
  });

  it('should allow authenticated user to read/write their own subcollections', async () => {
    const alice = testEnv.authenticatedContext('alice');

    // Pets
    await assertSucceeds(
      alice.firestore().doc('users/alice/pets/pet1').set({ name: 'Fido' })
    );

    // Vets
    await assertSucceeds(
      alice.firestore().doc('users/alice/vets/vet1').set({ name: 'Dr. Smith' })
    );

    // Feedings
    await assertSucceeds(
      alice
        .firestore()
        .doc('users/alice/pets/pet1/feedings/feed1')
        .set({ type: 'food' })
    );
  });

  it('should deny authenticated user from accessing others subcollections', async () => {
    const alice = testEnv.authenticatedContext('alice');

    // Pets
    await assertFails(
      alice.firestore().doc('users/bob/pets/pet1').set({ name: 'Fido' })
    );

    // Vets
    await assertFails(
      alice.firestore().doc('users/bob/vets/vet1').set({ name: 'Dr. Smith' })
    );

    // Feedings
    await assertFails(
      alice
        .firestore()
        .doc('users/bob/pets/pet1/feedings/feed1')
        .set({ type: 'food' })
    );
  });

  // Incidents (NFR-8, §D7): owner-scoped reads/writes; cross-user access denied.
  it('should allow owner to read/write their own incident document', async () => {
    const alice = testEnv.authenticatedContext('alice');

    await assertSucceeds(
      alice
        .firestore()
        .doc('users/alice/incidents/incident1')
        .set({ petId: 'pet1', startedAt: Date.now() })
    );
    await assertSucceeds(
      alice.firestore().doc('users/alice/incidents/incident1').get()
    );
  });

  it('should deny another user from reading/writing someone else incident', async () => {
    const alice = testEnv.authenticatedContext('alice');

    await assertFails(
      alice
        .firestore()
        .doc('users/bob/incidents/incident1')
        .set({ petId: 'pet1', startedAt: Date.now() })
    );
    await assertFails(
      alice.firestore().doc('users/bob/incidents/incident1').get()
    );
  });
});

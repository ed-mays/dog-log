import { vi } from 'vitest';
import type { AuthState } from '@store/auth.store';
import type { Pet } from '@features/pets/types';
import { makeZustandSelectorMock } from '@testUtils/mocks/mockZustand';
import { useSyncExternalStore } from 'react';

// Note: PetsState is not exported from the store by default; we provide a minimal compatible shape for tests.
export type TestPetsState = {
  pets: Pet[];
  isFetching?: boolean;
  fetchError?: Error | null;
  fetchPets: ReturnType<typeof vi.fn>;
  addPet: ReturnType<typeof vi.fn>;
  updatePet: ReturnType<typeof vi.fn>;
  deletePet: ReturnType<typeof vi.fn>;
};

export function createPetsStoreMock(initial: Partial<TestPetsState> = {}) {
  const stateRef = {
    pets: initial.pets ?? [],
    isFetching: initial.isFetching ?? false,
    fetchError: (initial.fetchError as Error | null | undefined) ?? null,
  } as {
    pets: Pet[];
    isFetching: boolean;
    fetchError: Error | null;
  };

  // Extract only function overrides from initial (e.g., custom action fns)
  const maybeActions = Object.fromEntries(
    Object.entries(initial).filter(([, v]) => typeof v === 'function')
  ) as Partial<TestPetsState>;

  // Simple pub/sub to notify React subscribers when actions mutate state
  const listeners = new Set<() => void>();
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const notify = () => {
    listeners.forEach((l) => l());
  };

  const actions = {
    fetchPets: vi.fn(async () => {}),
    addPet: vi.fn(async (pet: Partial<Pet>) => {
      const newPet: Pet = {
        id: 'new-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test',
        isArchived: false,
        ...pet,
      } as Pet;
      stateRef.pets = [...stateRef.pets, newPet];
      notify();
    }),
    updatePet: vi.fn(
      async (
        id: string,
        updates: Partial<Pick<Pet, 'name' | 'breed' | 'birthDate'>>
      ) => {
        stateRef.pets = stateRef.pets.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        notify();
      }
    ),
    deletePet: vi.fn(async (id: string) => {
      stateRef.pets = stateRef.pets.filter((p) => p.id !== id);
      notify();
    }),
    ...maybeActions,
  } as TestPetsState;

  // Snapshot with getters; we recreate it on state updates to change identity only when notifying subscribers
  type Snapshot = TestPetsState & {
    pets: Pet[];
    isFetching: boolean;
    fetchError: Error | null;
  };

  const makeSnapshot = () => {
    const snap = {} as Snapshot;
    Object.defineProperty(snap, 'pets', {
      get: () => stateRef.pets,
      enumerable: true,
    });
    Object.defineProperty(snap, 'isFetching', {
      get: () => stateRef.isFetching,
      enumerable: true,
    });
    Object.defineProperty(snap, 'fetchError', {
      get: () => stateRef.fetchError,
      enumerable: true,
    });
    // Expose action functions via getters to always reflect the current spy instances
    Object.defineProperty(snap, 'fetchPets', {
      get: () => actions.fetchPets,
      enumerable: true,
    });
    Object.defineProperty(snap, 'addPet', {
      get: () => actions.addPet,
      enumerable: true,
    });
    Object.defineProperty(snap, 'updatePet', {
      get: () => actions.updatePet,
      enumerable: true,
    });
    Object.defineProperty(snap, 'deletePet', {
      get: () => actions.deletePet,
      enumerable: true,
    });
    return snap;
  };

  let snapshotRef = makeSnapshot();

  // Override notify to also rotate the snapshot reference so useSyncExternalStore sees a change
  const originalNotify = notify;
  const enhancedNotify = () => {
    snapshotRef = makeSnapshot();
    originalNotify();
  };

  // Reassign notify used in actions
  // Replace calls in actions to use enhancedNotify
  // Preserve or wrap provided overrides for actions so tests can assert on their spies.
  // If no override is provided, use default state-mutating implementations.
  if (!maybeActions.addPet) {
    actions.addPet = vi.fn(async (pet: Partial<Pet>) => {
      const newPet: Pet = {
        id: 'new-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test',
        isArchived: false,
        ...pet,
      } as Pet;
      stateRef.pets = [...stateRef.pets, newPet];
      // Defer notification to the next macrotask so tests using waitForElementToBeRemoved
      // can observe the element before it disappears.
      setTimeout(() => enhancedNotify(), 0);
    }) as unknown as TestPetsState['addPet'];
  } else {
    const provided = maybeActions.addPet as TestPetsState['addPet'];
    actions.addPet = vi.fn(async (...args: Parameters<typeof provided>) => {
      // Call the provided spy implementation; do not mutate local state implicitly.
      return provided(...args);
    }) as unknown as TestPetsState['addPet'];
  }

  if (!maybeActions.updatePet) {
    actions.updatePet = vi.fn(
      async (
        id: string,
        updates: Partial<Pick<Pet, 'name' | 'breed' | 'birthDate'>>
      ) => {
        stateRef.pets = stateRef.pets.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        enhancedNotify();
      }
    ) as unknown as TestPetsState['updatePet'];
  } else {
    const provided = maybeActions.updatePet as TestPetsState['updatePet'];
    actions.updatePet = vi.fn(async (...args: Parameters<typeof provided>) => {
      return provided(...args);
    }) as unknown as TestPetsState['updatePet'];
  }

  if (!maybeActions.deletePet) {
    actions.deletePet = vi.fn(async (id: string) => {
      stateRef.pets = stateRef.pets.filter((p) => p.id !== id);
      enhancedNotify();
    }) as unknown as TestPetsState['deletePet'];
  } else {
    const provided = maybeActions.deletePet as TestPetsState['deletePet'];
    actions.deletePet = vi.fn(async (...args: Parameters<typeof provided>) => {
      // Call provided spy (which may resolve or throw). Do not mutate local state here.
      return provided(...args);
    }) as unknown as TestPetsState['deletePet'];
  }

  const getSnapshot = () => snapshotRef;

  // Zustand selector-compatible mock with subscription support
  function useTestPetsStoreMock<TSelected = Snapshot>(
    selector?: (s: Snapshot) => TSelected
  ): TSelected | Snapshot {
    const value = useSyncExternalStore(subscribe, getSnapshot);
    return selector ? selector(value) : value;
  }

  return {
    impl: useTestPetsStoreMock,
    actions,
    getState: getSnapshot,
    stateRef,
  };
}

export type TestAuthState = Pick<
  AuthState,
  'user' | 'initializing' | 'error'
> & {
  initAuthListener?: () => void;
  signInWithGoogle?: () => Promise<void>;
  signOut?: () => Promise<void>;
  reset?: () => void;
};

export function createAuthStoreMock(overrides: Partial<TestAuthState> = {}) {
  const actions = {
    initAuthListener: vi.fn(() => {}),
    signInWithGoogle: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    reset: vi.fn(() => {}),
  } as Required<
    Pick<
      TestAuthState,
      'initAuthListener' | 'signInWithGoogle' | 'signOut' | 'reset'
    >
  >;

  // Allow overrides to inject custom spy implementations without using `any`
  if (typeof overrides.initAuthListener === 'function') {
    actions.initAuthListener = overrides.initAuthListener;
  }
  if (typeof overrides.signInWithGoogle === 'function') {
    actions.signInWithGoogle = overrides.signInWithGoogle;
  }
  if (typeof overrides.signOut === 'function') {
    actions.signOut = overrides.signOut;
  }
  if (typeof overrides.reset === 'function') {
    actions.reset = overrides.reset;
  }

  const base: TestAuthState = {
    user: null,
    initializing: false,
    error: null,
    ...overrides,
    // Ensure action functions in state reflect our spies
    initAuthListener: actions.initAuthListener,
    signInWithGoogle: actions.signInWithGoogle,
    signOut: actions.signOut,
    reset: actions.reset,
  };
  return {
    impl: makeZustandSelectorMock(base),
    state: base,
    actions,
  };
}

export type UiState = { loading: boolean; error: Error | null };
export function createUiStoreMock(overrides: Partial<UiState> = {}) {
  const base: UiState = {
    loading: false,
    error: null,
    ...overrides,
  };
  return {
    impl: makeZustandSelectorMock(base),
    state: base,
  };
}

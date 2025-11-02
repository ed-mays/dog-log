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

  // Stable snapshot object; properties read through getters so reference is stable
  type Snapshot = TestPetsState & {
    pets: Pet[];
    isFetching: boolean;
    fetchError: Error | null;
  };
  const snapshot = {} as Snapshot;
  Object.defineProperty(snapshot, 'pets', {
    get: () => stateRef.pets,
    enumerable: true,
  });
  Object.defineProperty(snapshot, 'isFetching', {
    get: () => stateRef.isFetching,
    enumerable: true,
  });
  Object.defineProperty(snapshot, 'fetchError', {
    get: () => stateRef.fetchError,
    enumerable: true,
  });
  // Attach action functions as stable methods
  Object.assign(snapshot, actions);

  const getSnapshot = () => snapshot;

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
  const base: TestAuthState = {
    user: null,
    initializing: false,
    error: null,
    ...overrides,
  };
  return {
    impl: makeZustandSelectorMock(base),
    state: base,
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

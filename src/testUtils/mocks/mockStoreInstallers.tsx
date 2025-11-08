import { vi } from 'vitest';
import { useAuthStore } from '@store/auth.store';
import { usePetsStore } from '@store/pets.store';
import { useUiStore } from '@store/ui.store';
import {
  createAuthStoreMock,
  createPetsStoreMock,
  createUiStoreMock,
} from '@testUtils/mocks/mockStores';

/**
 * One-liner installers for selector-compatible Zustand store mocks used in component tests.
 *
 * Pattern:
 * - In the test file, mock the store module to expose `vi.fn()` hooks:
 *   vi.mock('@store/auth.store', () => ({ useAuthStore: vi.fn() }));
 * - Then call `installAuthStoreMock({...})` in `beforeEach` to provide the selector-compatible implementation.
 * - The returned object exposes `.actions`, `.getState`, and `.stateRef` for assertions.
 */

export function installAuthStoreMock(
  overrides?: Parameters<typeof createAuthStoreMock>[0]
) {
  const mock = createAuthStoreMock(overrides);
  vi.mocked(useAuthStore).mockImplementation(
    mock.impl as unknown as typeof useAuthStore
  );
  return mock;
}

export function installPetsStoreMock(
  overrides?: Parameters<typeof createPetsStoreMock>[0]
) {
  const mock = createPetsStoreMock(overrides);
  vi.mocked(usePetsStore).mockImplementation(
    mock.impl as unknown as typeof usePetsStore
  );
  return mock;
}

export function installUiStoreMock(
  overrides?: Parameters<typeof createUiStoreMock>[0]
) {
  const mock = createUiStoreMock(overrides);
  vi.mocked(useUiStore).mockImplementation(
    mock.impl as unknown as typeof useUiStore
  );
  return mock;
}

/**
 * Optional utility: clear all store hook mock implementations.
 * Keep using `vi.resetAllMocks()` in tests; this is here when you need an explicit reset mid-test.
 */
export function resetInstalledStoreMocks() {
  vi.mocked(useAuthStore).mockReset?.();
  vi.mocked(usePetsStore).mockReset?.();
  vi.mocked(useUiStore).mockReset?.();
}

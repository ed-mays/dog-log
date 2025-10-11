import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@test-utils';
import { useResetStores } from './useResetStores';
import { usePetsStore } from './pets.store';
import { useAuthStore } from './auth.store';
import { useUiStore } from '@store/ui.store';

function Harness({ onReady }: { onReady: (fn: () => void) => void }) {
  const resetStores = useResetStores();
  useEffect(() => {
    onReady(resetStores);
  }, [onReady, resetStores]);
  return null;
}

// Keep originals to restore after tests
let originalPetsReset: () => void;
let originalAuthReset: () => void;
let originalUiReset: () => void;

beforeEach(() => {
  cleanup();
  // Capture original reset functions
  originalPetsReset = usePetsStore.getState().reset;
  originalAuthReset = useAuthStore.getState().reset;
  originalUiReset = useUiStore.getState().reset;
});

afterEach(() => {
  // Restore originals
  usePetsStore.setState((s) => ({ ...s, reset: originalPetsReset }));
  useAuthStore.setState((s) => ({ ...s, reset: originalAuthReset }));
  useUiStore.setState((s) => ({ ...s, reset: originalUiReset }));
  vi.restoreAllMocks();
  cleanup();
});

describe('useResetStores', () => {
  it('calls reset on pets, auth, and ui stores', () => {
    const petsReset = vi.fn();
    const authReset = vi.fn();
    const uiReset = vi.fn();

    // Swap in our mock reset functions on each store
    usePetsStore.setState((s) => ({ ...s, reset: petsReset }));
    useAuthStore.setState((s) => ({ ...s, reset: authReset }));
    useUiStore.setState((s) => ({ ...s, reset: uiReset }));

    let callback: (() => void) | null = null;

    render(<Harness onReady={(fn) => (callback = fn)} />);

    expect(callback).toBeInstanceOf(Function);
    // Invoke the reset function returned by the hook
    callback();
    expect(petsReset).toHaveBeenCalledTimes(1);
    expect(authReset).toHaveBeenCalledTimes(1);
    expect(uiReset).toHaveBeenCalledTimes(1);
  });

  it('returns a stable callback reference across re-renders', () => {
    const firstReset = vi.fn();
    const secondReset = vi.fn();
    const thirdReset = vi.fn();
    // Even if underlying store reset references change, the hook result should be stable
    usePetsStore.setState((s) => ({ ...s, reset: firstReset }));
    useAuthStore.setState((s) => ({ ...s, reset: secondReset }));
    useUiStore.setState((s) => ({ ...s, reset: thirdReset }));

    let first: (() => void) | null = null;
    let second: (() => void) | null = null;

    const { rerender } = render(
      <Harness
        onReady={(fn) => {
          first = fn;
        }}
      />
    );

    // Force a re-render with a new onReady instance
    rerender(
      <Harness
        onReady={(fn) => {
          second = fn;
        }}
      />
    );

    expect(first).toBeInstanceOf(Function);
    expect(second).toBeInstanceOf(Function);
    // useCallback with [] should keep the same reference
    expect(second).toBe(first);
  });
});

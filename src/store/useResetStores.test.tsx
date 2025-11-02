import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@test-utils';

// Declare spies globally, but don't initialize them here
// They will be initialized in beforeEach
let petsResetSpy: vi.Mock;
let authResetSpy: vi.Mock;
let uiResetSpy: vi.Mock;

// Helper function to create a mock Zustand store object
// Defined as a function to avoid hoisting issues
function createMockZustandStore(resetSpy: vi.Mock) {
  return {
    getState: () => ({ reset: resetSpy }),
    setState: vi.fn(),
    subscribe: vi.fn(),
    destroy: vi.fn(),
  };
}

describe('useResetStores', () => {
  // Declare a variable to hold the dynamically imported useResetStores hook
  let useResetStoresActualHook: () => () => void;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules(); // Ensure a clean slate for module imports

    // Initialize spies for the current test run
    petsResetSpy = vi.fn();
    authResetSpy = vi.fn();
    uiResetSpy = vi.fn();

    // Use vi.doMock to mock the store modules dynamically within beforeEach
    // The factory function must return an object with the named export.
    vi.doMock('./pets.store', () => ({
      usePetsStore: createMockZustandStore(petsResetSpy),
    }));
    vi.doMock('./auth.store', () => ({
      useAuthStore: createMockZustandStore(authResetSpy),
    }));
    vi.doMock('@store/ui.store', () => ({
      useUiStore: createMockZustandStore(uiResetSpy),
    }));

    // Dynamically import useResetStores *after* mocks are set up
    // This ensures useResetStores gets the mocked versions of the stores
    const module = await import('./useResetStores');
    useResetStoresActualHook = module.useResetStores;
  });

  afterEach(() => {
    cleanup();
  });

  it('calls reset on pets, auth, and ui stores', () => {
    let callback: (() => void) | null = null;

    // Render a wrapper component that calls the hook
    const TestWrapper = () => {
      const resetStores = useResetStoresActualHook();
      useEffect(() => {
        callback = resetStores;
      }, [resetStores]);
      return null;
    };

    render(<TestWrapper />);

    expect(callback).toBeInstanceOf(Function);
    callback!(); // Invoke the reset function returned by the hook

    expect(petsResetSpy).toHaveBeenCalledTimes(1);
    expect(authResetSpy).toHaveBeenCalledTimes(1);
    expect(uiResetSpy).toHaveBeenCalledTimes(1);
  });

  it('returns a stable callback reference across re-renders', async () => {
    let capturedResetStores: (() => void) | null = null;

    const TestWrapper = ({ someProp }: { someProp: number }) => {
      const resetStores = useResetStoresActualHook();
      useEffect(() => {
        capturedResetStores = resetStores;
      }, [resetStores, someProp]); // Add someProp to dependencies to force useEffect on rerender
      return null;
    };

    const { rerender } = render(<TestWrapper someProp={1} />);

    // After initial render, capturedResetStores should be set
    expect(capturedResetStores).toBeInstanceOf(Function);
    const firstCaptured = capturedResetStores;

    // Force a re-render with a different prop to ensure the component updates
    rerender(<TestWrapper someProp={2} />);

    // Wait for the useEffect to run again and potentially update capturedResetStores
    await waitFor(() => {
      // Assert that the captured reference is still the same (stable)
      expect(capturedResetStores).toBe(firstCaptured);
    });
  });
});

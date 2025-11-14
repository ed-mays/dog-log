import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@test-utils';

// This suite uses the "unmock escape hatch" to load the real AuthBootstrap.
// We also spy on authService at the module boundary to verify side-effects.

describe('AuthBootstrap', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('subscribes to auth once on mount', async () => {
    // Arrange: prepare real module under test and spy on the service boundary
    // Unmock the component because it's globally mocked in vitest.setup.ts
    vi.unmock('@features/authentication/AuthBootstrap');

    const authServiceModule = await import('@services/auth/authService');
    // Spy on subscribeToAuth (exported function) and neutralize side-effects
    const subscribeSpy = vi
      .spyOn(authServiceModule, 'subscribeToAuth')
      .mockReturnValue(() => {});

    const { default: AuthBootstrap } = await import(
      '@features/authentication/AuthBootstrap'
    );

    // Act
    render(<AuthBootstrap />);

    // Assert
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('does not re-subscribe on re-render', async () => {
    vi.unmock('@features/authentication/AuthBootstrap');

    const authServiceModule = await import('@services/auth/authService');
    const subscribeSpy = vi
      .spyOn(authServiceModule, 'subscribeToAuth')
      .mockReturnValue(() => {});

    const { default: AuthBootstrap } = await import(
      '@features/authentication/AuthBootstrap'
    );

    const { rerender } = render(<AuthBootstrap />);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    // Re-render with the same component — effect should not run again
    rerender(<AuthBootstrap />);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', async () => {
    vi.unmock('@features/authentication/AuthBootstrap');

    const authServiceModule = await import('@services/auth/authService');
    const cleanup = vi.fn();
    const subscribeSpy = vi
      .spyOn(authServiceModule, 'subscribeToAuth')
      .mockReturnValue(cleanup);

    const { default: AuthBootstrap } = await import(
      '@features/authentication/AuthBootstrap'
    );

    const { unmount } = render(<AuthBootstrap />);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('returns no UI (renders null)', async () => {
    vi.unmock('@features/authentication/AuthBootstrap');
    const { default: AuthBootstrap } = await import(
      '@features/authentication/AuthBootstrap'
    );

    const { container } = render(<AuthBootstrap />);
    expect(container).toBeEmptyDOMElement();
  });
});

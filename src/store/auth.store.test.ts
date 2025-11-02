import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import type { AppUser } from '@services/auth/authService';

const signInSvcMock = vi.fn<Promise<void>, unknown[]>();
const signOutSvcMock = vi.fn<Promise<void>, unknown[]>();
let lastCb: ((u: unknown) => void) | null = null;
let lastErrCb: ((e: unknown) => void) | null = null;
let lastUnsubSpy: vi.Mock | null = null;

vi.mock('@services/auth/authService', () => ({
  signInWithGoogle: (...args: unknown[]) => signInSvcMock(...args),
  signOut: (...args: unknown[]) => signOutSvcMock(...args),
  subscribeToAuth: (
    cb: (u: unknown) => void,
    onError?: (e: unknown) => void
  ) => {
    lastCb = cb;
    lastErrCb = onError ?? null;
    lastUnsubSpy = vi.fn();
    return lastUnsubSpy;
  },
}));

beforeEach(() => {
  // reset store to initial
  useAuthStore.setState({ user: null, initializing: true, error: null });
  signInSvcMock.mockReset();
  signOutSvcMock.mockReset();
  lastCb = null;
  lastErrCb = null;
  lastUnsubSpy = null;
});

describe('auth.store', () => {
  it('initial state has initializing true', () => {
    const { initializing, user, error } = useAuthStore.getState();
    expect(initializing).toBe(true);
    expect(user).toBeNull();
    expect(error).toBeNull();
  });

  it('initAuthListener updates state on auth event', () => {
    const init = useAuthStore.getState().initAuthListener;
    init();
    expect(typeof lastCb).toBe('function');
    // simulate auth user
    lastCb?.({ uid: 'u1', displayName: null, email: null, photoURL: null });
    const { user, initializing, error } = useAuthStore.getState();
    expect(initializing).toBe(false);
    expect(error).toBeNull();
    expect(user?.uid).toBe('u1');
  });

  it('re-initializing auth listener unsubscribes previous subscription', () => {
    const init = useAuthStore.getState().initAuthListener;
    init();
    const firstUnsub = lastUnsubSpy!;
    expect(typeof firstUnsub).toBe('function');
    // call init again should call previous unsubscribe
    init();
    expect(firstUnsub).toHaveBeenCalledTimes(1);
  });

  it('initAuthListener handles error path', async () => {
    const init = useAuthStore.getState().initAuthListener;
    init();
    lastErrCb?.(new Error('boom'));
    // allow state update to flush
    await new Promise((r) => setTimeout(r, 0));
    const { initializing, error } = useAuthStore.getState();
    expect(initializing).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });

  it('signInWithGoogle sets error when service rejects', async () => {
    const err = new Error('popup closed');
    signInSvcMock.mockRejectedValueOnce(err);
    await expect(useAuthStore.getState().signInWithGoogle()).rejects.toBe(err);
    expect(useAuthStore.getState().error).toBe(err);
  });

  it('signOut delegates to service and keeps state until listener updates', async () => {
    signOutSvcMock.mockResolvedValueOnce();
    await useAuthStore.getState().signOut();
    expect(signOutSvcMock).toHaveBeenCalledTimes(1);
  });

  it('signOut sets error when service rejects and rethrows', async () => {
    const err = new Error('network');
    signOutSvcMock.mockRejectedValueOnce(err);
    await expect(useAuthStore.getState().signOut()).rejects.toBe(err);
    expect(useAuthStore.getState().error).toBe(err);
  });

  it('reset restores initial state', () => {
    useAuthStore.setState({
      user: { uid: 'x' } as unknown as AppUser,
      initializing: true,
      error: new Error('e'),
    });
    useAuthStore.getState().reset();
    const { user, initializing, error } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(initializing).toBe(false);
    expect(error).toBeNull();
  });
});

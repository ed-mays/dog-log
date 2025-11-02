import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, useAuthUser } from './auth.store';
import { useAuthStatus } from './auth.store';
import type { AppUser } from '@services/auth/authService';
import { render, screen } from '@test-utils';

function SelProbe() {
  const user = useAuthUser();
  const { initializing, error } = useAuthStatus();
  return (
    <div>
      <div data-testid="uid">{user?.uid ?? 'none'}</div>
      <div data-testid="init">{String(initializing)}</div>
      <div data-testid="err">
        {error instanceof Error ? error.message : String(error)}
      </div>
    </div>
  );
}

describe('auth.store selector hooks', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, initializing: true, error: null });
  });

  it('reflects store state changes via selector hooks', async () => {
    render(<SelProbe />);

    // Initial (from beforeEach): initializing true, no user, no error
    expect(screen.getByTestId('uid')).toHaveTextContent('none');
    expect(screen.getByTestId('init')).toHaveTextContent('true');
    expect(screen.getByTestId('err')).toHaveTextContent('null');

    // Simulate login: set user and clear initializing
    const user: AppUser = {
      uid: 'u1',
      displayName: null,
      email: null,
      photoURL: null,
    };
    useAuthStore.setState({ user, initializing: false, error: null });

    // Allow state propagation to the component
    await Promise.resolve();

    expect(screen.getByTestId('uid')).toHaveTextContent('u1');
    expect(screen.getByTestId('init')).toHaveTextContent('false');
    expect(screen.getByTestId('err')).toHaveTextContent('null');

    // Simulate error update
    useAuthStore.setState({ error: new Error('oops') });
    await Promise.resolve();
    expect(screen.getByTestId('err')).toHaveTextContent('oops');
  });
});

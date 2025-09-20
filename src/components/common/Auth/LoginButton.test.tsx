import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import LoginButton from './LoginButton';
import { useAuthStore } from '@store/auth.store';

describe('LoginButton', () => {
  let signInMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    signInMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState((prev) => ({
      ...prev,
      initializing: false,
      signInWithGoogle: signInMock,
    }));
  });

  it('calls signInWithGoogle on click', async () => {
    render(<LoginButton />);
    const btn = screen.getByRole('button', { name: /continue with google/i });
    await userEvent.click(btn);
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when initializing', async () => {
    useAuthStore.setState((prev) => ({ ...prev, initializing: true }));
    render(<LoginButton />);
    const btn = screen.getByRole('button', { name: /continue with google/i });
    expect(btn).toBeDisabled();
  });
});

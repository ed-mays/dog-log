import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import LogoutButton from './LogoutButton';
import { useAuthStore } from '@store/auth.store';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (mod) => {
  const actual = await mod();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('LogoutButton', () => {
  let signOutMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    signOutMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState((prev) => ({
      ...prev,
      initializing: false,
      signOut: signOutMock,
    }));
  });

  it('calls signOut and navigates to /welcome', async () => {
    render(<LogoutButton />);
    const btn = screen.getByRole('button', { name: /log out/i });
    await userEvent.click(btn);
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/welcome', { replace: true });
  });
});

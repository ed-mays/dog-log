import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import { GoogleAuth } from './GoogleAuth';
import { useAuthStore } from '@store/auth.store';
import { User } from 'firebase/auth';

// Mock child components to isolate the GoogleAuth component's logic
vi.mock('./GoogleLoginButton', () => ({
  default: () => <div data-testid="google-login-button"></div>,
}));

vi.mock('./LogoutButton', () => ({
  default: () => <div data-testid="logout-button"></div>,
}));

describe('GoogleAuth', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({ user: null, initializing: false });
  });

  it('renders GoogleLoginButton when user is not authenticated', () => {
    render(<GoogleAuth />);

    // Expect the login button to be present and the logout button to be absent
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('renders LogoutButton when user is authenticated', () => {
    // Mock a user object
    const mockUser = { uid: '123', displayName: 'Test User' } as User;

    // Set the user in the auth store
    useAuthStore.setState({ user: mockUser });

    render(<GoogleAuth />);

    // Expect the logout button to be present and the login button to be absent
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.queryByTestId('google-login-button')).not.toBeInTheDocument();
  });
});

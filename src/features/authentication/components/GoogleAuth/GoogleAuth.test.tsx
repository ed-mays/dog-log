import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import type { User } from 'firebase/auth';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';

// Standardized pattern: expose a vi.fn() hook and install selector-compatible mocks per-test
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock child components to isolate the GoogleAuth component's logic
vi.mock('./GoogleLoginButton', () => ({
  default: () => <div data-testid="google-login-button"></div>,
}));

vi.mock('./LogoutButton', () => ({
  default: () => <div data-testid="logout-button"></div>,
}));

// Import after mocks so the component receives mocked modules
import { GoogleAuth } from './GoogleAuth';

describe('GoogleAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installAuthStoreMock({ user: null, initializing: false });
  });

  it('renders GoogleLoginButton when user is not authenticated', () => {
    render(<GoogleAuth />);

    // Expect the login button to be present and the logout button to be absent
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('renders LogoutButton when user is authenticated', () => {
    installAuthStoreMock({
      user: { uid: '123', displayName: 'Test User' } as User,
      initializing: false,
    });

    render(<GoogleAuth />);

    // Expect the logout button to be present and the login button to be absent
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.queryByTestId('google-login-button')).not.toBeInTheDocument();
  });
});

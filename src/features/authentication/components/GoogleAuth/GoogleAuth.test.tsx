import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import type { User } from 'firebase/auth';

// ADR-019 Default Pattern: Mock the auth store at module scope and drive state via variables
let mockUser: User | null = null;
let initializing = false;

vi.mock('@store/auth.store.ts', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    initializing,
  })),
}));

// Mock child components to isolate the GoogleAuth component's logic
vi.mock('./GoogleLoginButton', () => ({
  default: () => <div data-testid="google-login-button"></div>,
}));

vi.mock('./LogoutButton', () => ({
  default: () => <div data-testid="logout-button"></div>,
}));

// Import after mocks so the component receives mocked modules per ADR-019
import { GoogleAuth } from './GoogleAuth';

describe('GoogleAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    initializing = false;
  });

  it('renders GoogleLoginButton when user is not authenticated', () => {
    // default: mockUser null, initializing false
    render(<GoogleAuth />);

    // Expect the login button to be present and the logout button to be absent
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('renders LogoutButton when user is authenticated', () => {
    // Provide a mocked user state via variables consumed by the mock store
    mockUser = { uid: '123', displayName: 'Test User' } as User;

    render(<GoogleAuth />);

    // Expect the logout button to be present and the login button to be absent
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.queryByTestId('google-login-button')).not.toBeInTheDocument();
  });
});

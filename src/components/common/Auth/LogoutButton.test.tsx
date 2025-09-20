import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render } from '@/test-utils';
import LogoutButton from './LogoutButton';

// ---- Typed Zustand Store Mock ----
type SignOut = () => Promise<void>;
interface AuthStoreState {
  initializing: boolean;
  signOut: SignOut;
}

const signOutMock: SignOut = vi.fn(async () => {});
let mockState: AuthStoreState = {
  initializing: false,
  signOut: signOutMock,
};

vi.mock('@store/auth.store', () => ({
  useAuthStore: (selector: (s: AuthStoreState) => unknown) =>
    selector(mockState),
}));

// ---- Router useNavigate Mock ----
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<{ [key: string]: unknown }>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { initializing: false, signOut: signOutMock };
  });

  it('renders with default label', () => {
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('calls signOut and navigates to /welcome on click', async () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/welcome', { replace: true });
    });
  });

  it('is disabled when initializing is true', () => {
    mockState.initializing = true;
    render(<LogoutButton />);
    const btn = screen.getByRole('button', { name: 'Log out' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled when disabled prop is true', () => {
    mockState.initializing = false;
    render(<LogoutButton disabled />);
    const btn = screen.getByRole('button', { name: 'Log out' });
    expect(btn).toBeDisabled();
  });
});

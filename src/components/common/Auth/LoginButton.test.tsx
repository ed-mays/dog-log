import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { render } from '@/test-utils';
import LoginButton from './LoginButton';

// ---- Typed Zustand Store Mock ----
type SignIn = () => Promise<void>;
interface AuthStoreState {
  initializing: boolean;
  signInWithGoogle: SignIn;
}

const signInMock: SignIn = vi.fn(async () => {});
let mockState: AuthStoreState = {
  initializing: false,
  signInWithGoogle: signInMock,
};

vi.mock('@store/auth.store', () => ({
  useAuthStore: (selector: (s: AuthStoreState) => unknown) =>
    selector(mockState),
}));

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { initializing: false, signInWithGoogle: signInMock };
  });

  it('renders with default label', () => {
    render(<LoginButton />);
    expect(
      screen.getByRole('button', { name: 'Continue with Google' })
    ).toBeInTheDocument();
  });

  it('calls signInWithGoogle on click', () => {
    render(<LoginButton />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Continue with Google' })
    );
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when initializing is true', () => {
    mockState.initializing = true;
    render(<LoginButton />);
    const btn = screen.getByRole('button', { name: 'Continue with Google' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled when disabled prop is true even if not initializing', () => {
    mockState.initializing = false;
    render(<LoginButton disabled />);
    const btn = screen.getByRole('button', { name: 'Continue with Google' });
    expect(btn).toBeDisabled();
  });
});

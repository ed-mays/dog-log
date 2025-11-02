import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, withLocale } from '@test-utils';
import userEvent from '@testing-library/user-event';

// ADR-019 Default Pattern: Mock the auth store at module scope and drive state via variables
let initializing = false;
let signInMock: ReturnType<typeof vi.fn> = vi.fn();

type AuthStateMock = {
  initializing: boolean;
  signInWithGoogle: () => Promise<void> | void;
};

vi.mock('@store/auth.store.ts', () => ({
  useAuthStore: vi.fn((selector?: (s: AuthStateMock) => unknown) => {
    const state: AuthStateMock = { initializing, signInWithGoogle: signInMock };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// Import after mocks so the component receives mocked modules per ADR-019
import GoogleLoginButton from './GoogleLoginButton';

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initializing = false;
    signInMock = vi.fn().mockResolvedValue(undefined);
  });

  it('calls signInWithGoogle on click', async () => {
    render(<GoogleLoginButton />);
    const btn = await screen.findByTestId('login-button');
    await userEvent.click(btn);
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  describe('Initialization behavior', () => {
    it('is disabled while initializing', async () => {
      initializing = true;
      render(<GoogleLoginButton />);

      const button = await screen.findByTestId('login-button');
      expect(button).toBeDisabled();
    });
  });

  it('is enabled when not initializing', async () => {
    initializing = false;
    render(<GoogleLoginButton />);

    const button = await screen.findByTestId('login-button');
    expect(button).toBeEnabled();
  });

  describe('i18N behavior', () => {
    it.todo('loads translations from the i18n provider', async () => {});

    it('translates the button text in English', async () => {
      render(<GoogleLoginButton />);

      const button = await screen.findByTestId('login-button');
      expect(button).toHaveTextContent('Continue with Google');
    });

    it('translates the button text in Spanish', async () => {
      await withLocale('es', async () => {
        render(<GoogleLoginButton />);

        const button = await screen.findByTestId('login-button');
        expect(button).toHaveTextContent('Continuar con Google');
      });
    });
  });
});

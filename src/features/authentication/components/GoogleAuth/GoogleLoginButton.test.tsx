import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, withLocale } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';

// Standardized pattern: expose a vi.fn() hook and install selector-compatible mocks per-test
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// Import after mocks so the component receives mocked modules
import GoogleLoginButton from './GoogleLoginButton';

describe('GoogleLoginButton', () => {
  let signInWithGoogle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    installAuthStoreMock({ initializing: false, signInWithGoogle });
  });

  it('calls signInWithGoogle on click', async () => {
    render(<GoogleLoginButton />);
    const btn = await screen.findByTestId('login-button');
    await userEvent.click(btn);
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  describe('Initialization behavior', () => {
    it('is disabled while initializing', async () => {
      installAuthStoreMock({ initializing: true });
      render(<GoogleLoginButton />);

      const button = await screen.findByTestId('login-button');
      expect(button).toBeDisabled();
    });
  });

  it('is enabled when not initializing', async () => {
    installAuthStoreMock({ initializing: false });
    render(<GoogleLoginButton />);

    const button = await screen.findByTestId('login-button');
    expect(button).toBeEnabled();
  });

  describe('i18N behavior', () => {
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

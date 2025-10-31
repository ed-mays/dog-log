import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, withLocale } from '@test-utils';
import userEvent from '@testing-library/user-event';
import GoogleLoginButton from './GoogleLoginButton';
import { useAuthStore } from '@store/auth.store';
import { AuthState } from '@store/auth.store';
import { act } from 'react';

describe('GoogleLoginButton', () => {
  let signInMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    signInMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState((prev: AuthState) => ({
      ...prev,
      initializing: false,
      signInWithGoogle: signInMock,
    }));
  });

  it('calls signInWithGoogle on click', async () => {
    render(<GoogleLoginButton />);
    const btn = await screen.findByRole('button', {
      'data-testid': 'login-button',
    });
    await userEvent.click(btn);
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  describe('Initialization behavior', () => {
    it('is disabled while initializing', async () => {
      useAuthStore.setState((prev) => ({ ...prev, initializing: true }));
      render(<GoogleLoginButton />);

      const button = await screen.findByTestId('login-button');
      expect(button).toBeDisabled();
    });
  });

  it('is enabled after initializing', async () => {
    useAuthStore.setState((prev) => ({ ...prev, initializing: true }));
    render(<GoogleLoginButton />);

    const button = await screen.findByTestId('login-button');

    act(() =>
      useAuthStore.setState((prev) => ({ ...prev, initializing: false }))
    );

    expect(button).toBeEnabled();
  });

  describe('i18N behavior', () => {
    it.todo('loads translations from the i18n provider', async () => {});

    it('translates the button text in English', async () => {
      useAuthStore.setState((prev) => ({ ...prev, initializing: false }));
      render(<GoogleLoginButton />);

      const button = await screen.findByTestId('login-button');
      expect(button).toHaveTextContent('Continue with Google');
    });

    it('translates the button text in Spanish', async () => {
      useAuthStore.setState((prev) => ({ ...prev, initializing: false }));
      await withLocale('es', async () => {
        render(<GoogleLoginButton />);

        const button = await screen.findByTestId('login-button');
        expect(button).toHaveTextContent('Continuar con Google');
      });
    });
  });
});

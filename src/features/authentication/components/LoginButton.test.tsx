import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import LoginButton from './LoginButton';
import { useAuthStore } from '@store/auth.store';
import { AuthState } from '@store/auth.store';
import { Suspense } from 'react';
import { waitFor } from '@testing-library/react';

describe('LoginButton', () => {
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
    render(<LoginButton />);
    const btn = await screen.findByRole('button', {
      dataTestId: 'login-button',
    });
    await userEvent.click(btn);
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  describe('Initialization behavior', () => {
    it('is disabled while initializing', async () => {
      useAuthStore.setState((prev) => ({ ...prev, initializing: true }));
      const { asFragment, findByTestId } = render(
        <Suspense fallback={<div />}>
          <LoginButton />
          );
        </Suspense>
      );

      await waitFor(() => findByTestId('login-button'));
      expect(asFragment()).toMatchSnapshot();
    });
  });

  it('is enabled after initializing', async () => {
    useAuthStore.setState((prev) => ({ ...prev, initializing: true }));
    const { asFragment, findByTestId } = render(
      <Suspense fallback={<div />}>
        <LoginButton />
      </Suspense>
    );

    await waitFor(() => findByTestId('login-button'));
    useAuthStore.setState((prev) => ({ ...prev, initializing: false }));

    expect(asFragment()).toMatchSnapshot();
  });

  describe('i18N behavior', () => {
    it.todo('loads translations from the i18n provider', async () => {});
    it.todo('translates the button test in English', async () => {});
    it.todo('translates the button test in Spanish', async () => {});
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import LogoutButton from './LogoutButton';
import { useAuthStore } from '@store/auth.store';
import { Suspense } from 'react';
import { waitFor } from '@testing-library/react';
import i18n from '@i18n';

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
    const btn = await screen.findByRole('button', { name: /log out/i });
    await userEvent.click(btn);
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/welcome', { replace: true });
  });

  describe('i18N behavior', () => {
    it.todo('loads translations from the i18n provider', async () => {});

    it('translates the button text in English', async () => {
      useAuthStore.setState((prev) => ({ ...prev, initializing: false }));
      await i18n.changeLanguage('en');
      const { asFragment, findByTestId } = render(
        <Suspense fallback={<div />}>
          <LogoutButton />
        </Suspense>
      );

      await waitFor(() => findByTestId('logout-button'));

      expect(asFragment()).toMatchSnapshot();
    });

    it('translates the button text in Spanish', async () => {
      useAuthStore.setState((prev) => ({ ...prev, initializing: false }));
      await i18n.changeLanguage('es');
      const { asFragment, findByTestId } = render(
        <Suspense fallback={<div />}>
          <LogoutButton />
        </Suspense>
      );

      const button = await waitFor(() => findByTestId('logout-button'));
      expect(button).toHaveTextContent('Cerrar sesión');
      expect(asFragment()).toMatchSnapshot();
    });
  });
});

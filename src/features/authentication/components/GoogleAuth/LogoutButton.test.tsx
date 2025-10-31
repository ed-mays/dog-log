import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, withLocale } from '@test-utils';
import userEvent from '@testing-library/user-event';
import LogoutButton from './LogoutButton';
import { useAuthStore } from '@store/auth.store';

const resetStoresMock = vi.fn();
vi.mock('@store/useResetStores.tsx', () => ({
  useResetStores: () => resetStoresMock,
}));

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
  const user = userEvent.setup();

  beforeEach(() => {
    signOutMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ initializing: false, signOut: signOutMock });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls signOut, resets stores, and navigates to /welcome on click', async () => {
    render(<LogoutButton />);
    const logoutButton = await screen.findByRole('button', {
      name: /log out/i,
    });

    await user.click(logoutButton);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(resetStoresMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/welcome', { replace: true });
  });

  it('is disabled when the disabled prop is true', async () => {
    render(<LogoutButton disabled />);
    const logoutButton = await screen.findByRole('button', {
      name: /log out/i,
    });
    expect(logoutButton).toBeDisabled();
  });

  it('is disabled and shows busy state while auth is initializing', async () => {
    useAuthStore.setState({ initializing: true });
    render(<LogoutButton />);

    const logoutButton = await screen.findByRole('button', {
      name: /log out/i,
    });
    expect(logoutButton).toBeDisabled();
    expect(logoutButton).toHaveAttribute('aria-busy', 'true');
  });

  it('does not render the button until i18n namespaces are ready', async () => {
    render(<LogoutButton />);
    // Initially, the button is not present because nsReady is false
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // It appears after namespaces are loaded
    const logoutButton = await screen.findByRole('button', {
      name: /log out/i,
    });
    expect(logoutButton).toBeInTheDocument();
  });

  describe('i18n translations', () => {
    it.each([
      { lang: 'en', expectedText: 'Log out', expectedAriaLabel: 'Log out' },
      {
        lang: 'es',
        expectedText: 'Cerrar sesión',
        expectedAriaLabel: 'Cerrar sesión',
      },
    ])(
      'renders with correct text for language "$lang"',
      async ({ lang, expectedText, expectedAriaLabel }) => {
        await withLocale(lang, async () => {
          render(<LogoutButton />);
          const button = await screen.findByRole('button', {
            name: expectedAriaLabel,
          });
          expect(button).toHaveTextContent(expectedText);
        });
      }
    );
  });
});

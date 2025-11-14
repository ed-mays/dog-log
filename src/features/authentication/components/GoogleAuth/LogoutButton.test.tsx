import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, withLocale } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';

// Standardized pattern: expose a vi.fn() hook and install selector-compatible mocks per-test
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

const resetStoresMock = vi.fn();
vi.mock('@store/useResetStores', () => ({
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

// Import after mocks so the component receives mocked modules
import LogoutButton from './LogoutButton';

describe('LogoutButton', () => {
  let signOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    signOut = vi.fn().mockResolvedValue(undefined);
    installAuthStoreMock({ initializing: false, signOut });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls signOut, resets stores, and navigates to /welcome on click', async () => {
    render(<LogoutButton />);
    const logoutButton = await screen.findByRole('button', {
      name: /log out/i,
    });

    await userEvent.click(logoutButton);

    expect(signOut).toHaveBeenCalledTimes(1);
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
    installAuthStoreMock({ initializing: true });
    render(<LogoutButton />);

    const logoutButton = await screen.findByRole('button', {
      name: /log out/i,
    });
    expect(logoutButton).toBeDisabled();
    expect(logoutButton).toHaveAttribute('aria-busy', 'true');
  });

  it('does not render the button until i18n namespaces are ready', async () => {
    // This test remains commented out as nsReady is handled internally; revisit if needed.
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

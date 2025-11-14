import { render, screen } from '@test-utils';
import { WelcomePage } from './WelcomePage';
import { beforeAll, beforeEach, describe, it, vi, expect } from 'vitest';
import testI18n from '@testUtils/test-i18n';
import userEvent from '@testing-library/user-event';

// Standardize store mocking via installers
vi.mock('@store/auth.store', () => ({ useAuthStore: vi.fn() }));
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';

let authMock: ReturnType<typeof installAuthStoreMock>;

beforeAll(async () => {
  await testI18n.init();
});

beforeEach(() => {
  vi.resetAllMocks();
  // Unauthenticated by default; not initializing so button is enabled
  authMock = installAuthStoreMock({ user: null, initializing: false });
});

afterEach(async () => {
  await testI18n.changeLanguage('en');
});

describe('WelcomePage', () => {
  it('renders the welcome message and login button', async () => {
    render(<WelcomePage />);

    expect(
      await screen.findByRole('heading', { name: /welcome to dog log!/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/please sign in to continue\./i)
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /continue with google/i })
    ).toBeInTheDocument();
  });

  it('renders the expected content in English and enables the button', async () => {
    render(<WelcomePage />);

    expect(
      await screen.findByRole('heading', { name: /welcome to dog log!/i })
    ).toBeVisible();
    expect(
      await screen.findByText(/please sign in to continue\./i)
    ).toBeVisible();
    const button = await screen.findByRole('button', {
      name: /continue with google/i,
    });
    expect(button).toBeEnabled();
  });

  it('clicking the login button triggers sign-in via the auth store', async () => {
    render(<WelcomePage />);
    const button = await screen.findByRole('button', {
      name: /continue with google/i,
    });
    await userEvent.click(button);
    expect(authMock.actions.signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('renders the expected content in Spanish (no snapshots)', async () => {
    // Switch to Spanish for the duration of this test
    await testI18n.changeLanguage('es');
    try {
      render(<WelcomePage />);

      expect(
        await screen.findByRole('heading', { name: /bienvenido a dog log!/i })
      ).toBeVisible();
      expect(
        await screen.findByText(/inicia sesión para continuar\./i)
      ).toBeVisible();
      expect(
        await screen.findByRole('button', { name: /continuar con google/i })
      ).toBeInTheDocument();
    } finally {
      await testI18n.changeLanguage('en');
    }
  });
});

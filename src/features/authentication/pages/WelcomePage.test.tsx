import { render, screen, withLocale } from '@test-utils';
import { WelcomePage } from './WelcomePage';
import { afterEach } from 'vitest';
import testI18n from '@testUtils/test-i18n';

afterEach(async () => {
  await testI18n.changeLanguage('en');
});

describe('WelcomePage', () => {
  it('renders the welcome message and login button', async () => {
    render(<WelcomePage />);

    expect(
      await screen.findByRole('heading', { name: 'Welcome to Dog Log!' })
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Please sign in to continue.')
    ).toBeInTheDocument();
    expect(await screen.findByTestId('login-button')).toBeInTheDocument();
  });

  it('renders the expected content in English (no snapshots)', async () => {
    render(<WelcomePage />);

    expect(
      await screen.findByRole('heading', { name: 'Welcome to Dog Log!' })
    ).toBeVisible();
    expect(
      await screen.findByText('Please sign in to continue.')
    ).toBeVisible();
    // Prefer role-based button query if possible; keeping testid for now
    expect(await screen.findByTestId('login-button')).toBeEnabled();
  });

  it('renders the expected content in Spanish (no snapshots)', async () => {
    await withLocale('es', async () => {
      render(<WelcomePage />);

      expect(
        await screen.findByRole('heading', { name: 'Bienvenido a Dog Log!' })
      ).toBeVisible();
      expect(
        await screen.findByText('Inicia sesión para continuar.')
      ).toBeVisible();
      expect(await screen.findByTestId('login-button')).toBeInTheDocument();
    });
  });
});

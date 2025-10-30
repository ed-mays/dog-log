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

  it('renders the expected content in English', async () => {
    const { asFragment } = render(<WelcomePage />);

    await screen.findByTestId('login-button');
    await screen.findByText('Please sign in to continue.');
    await screen.findByRole('heading', { name: 'Welcome to Dog Log!' });
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders the expected content in Spanish', async () => {
    await withLocale('es', async () => {
      const { asFragment } = render(<WelcomePage />);

      await screen.findByTestId('login-button');
      await screen.findByText('Inicia sesión para continuar.');
      await screen.findByRole('heading', { name: 'Bienvenido a Dog Log!' });
      expect(asFragment()).toMatchSnapshot();
    });
  });
});

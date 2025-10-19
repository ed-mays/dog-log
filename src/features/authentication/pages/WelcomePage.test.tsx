import { render, screen, waitFor } from '@testing-library/react';
import { WelcomePage } from './WelcomePage';
import { Suspense } from 'react';
import i18n from 'i18next';

/*
vi.mock(import('react-i18next'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, fallback: string) => fallback,
    }),
  };
});
*/

describe('WelcomePage', () => {
  it('renders the welcome message and login button', async () => {
    render(<WelcomePage />);

    expect(await screen.findByText('Welcome to Dog Log!')).toBeInTheDocument();
    expect(
      await screen.findByText('Please sign in to continue.')
    ).toBeInTheDocument();
    expect(await screen.findByTestId('login-button')).toBeInTheDocument();
  });

  it('renders the expected content in English', async () => {
    const { asFragment } = render(
      <Suspense fallback={<div />}>
        <WelcomePage />
      </Suspense>
    );
    await waitFor(() => screen.findByTestId('login-button'));
    await waitFor(() => screen.findByText('Please sign in to continue.'));
    await waitFor(() => screen.findByText('Welcome to Dog Log!'));
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders the expected content in Spanish', async () => {
    await i18n.changeLanguage('es');
    const { asFragment } = render(
      <Suspense fallback={<div />}>
        <WelcomePage />
      </Suspense>
    );
    await waitFor(() => screen.findByText('Inicia sesión para continuar.'));
    await waitFor(() => screen.findByText('Bienvenido a Dog Log!'));
    expect(asFragment()).toMatchSnapshot();
  });
});

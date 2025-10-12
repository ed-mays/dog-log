import { render, screen } from '@testing-library/react';
import { WelcomePage } from './WelcomePage';

vi.mock(import('react-i18next'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, fallback: string) => fallback,
    }),
  };
});

describe('WelcomePage', () => {
  it('renders the welcome message and login button', async () => {
    render(<WelcomePage />);

    expect(await screen.findByText('Welcome to Dog Log!')).toBeInTheDocument();
    expect(
      await screen.findByText('Please sign in to continue.')
    ).toBeInTheDocument();
    expect(await screen.findByTestId('login-button')).toBeInTheDocument();
  });
});

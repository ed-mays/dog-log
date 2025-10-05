import { render, screen } from '@testing-library/react';
import { WelcomePage } from './WelcomePage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

vi.mock('@components/common/Auth/LoginButton', () => ({
  __esModule: true,
  default: () => <button>Login</button>,
}));

describe('WelcomePage', () => {
  it('renders the welcome message and login button', () => {
    render(<WelcomePage />);

    expect(screen.getByText('Welcome to Dog Log!')).toBeInTheDocument();
    expect(
      screen.getByText('Please sign in to continue.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});

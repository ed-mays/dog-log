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
  it('renders the welcome message and login button', async () => {
    render(<WelcomePage />);

    expect(screen.getByText('Welcome to Dog Log!')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to continue.')).toBeInTheDocument();
    expect(await screen.findByTestId('login-button')).toBeInTheDocument();
  });
});

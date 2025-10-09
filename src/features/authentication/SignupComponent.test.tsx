import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import SignupComponent from './SignupComponent';
import { useAuthStore } from '@/store/auth.store';
import testI18n from '@/testUtils/test-i18n';

describe('SignupComponent', () => {
  beforeEach(() => {
    // reset
    useAuthStore.setState({
      user: null,
      initializing: false,
      error: null,
    } as unknown as ReturnType<typeof useAuthStore.getState>);
  });

  it('shows loading status when initializing', () => {
    useAuthStore.setState((prev) => ({ ...prev, initializing: true }));
    render(<SignupComponent />, { i18nInstance: testI18n });
    expect(screen.getByRole('status')).toHaveTextContent(/Loading/i);
  });

  it('renders localized firebase error messages', () => {
    // simulate popup closed error
    useAuthStore.setState((prev) => ({
      ...prev,
      error: Object.assign(new Error('x'), {
        code: 'auth/popup-closed-by-user',
      }),
    }));
    render(<SignupComponent />, { i18nInstance: testI18n });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/The sign-in popup was closed/i);
  });
});

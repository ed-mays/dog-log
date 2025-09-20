import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import App from './App';
import { useAuthStore } from '@store/auth.store';

describe('App auth route protection', () => {
  beforeEach(() => {
    // default unauthenticated state
    useAuthStore.setState({
      user: null,
      initializing: false,
      error: null,
    } as unknown as ReturnType<typeof useAuthStore.getState>);
  });

  it('redirects unauthenticated users to /welcome for /pets', async () => {
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /welcome/i })
      ).toBeInTheDocument();
    });
  });

  it('allows authenticated users to access /pets', async () => {
    useAuthStore.setState((prev) => ({
      ...prev,
      user: {
        uid: '1',
        displayName: 'User',
        email: 'u@example.com',
        photoURL: null,
      },
    }));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('pet-list')).toBeInTheDocument();
    });
  });
});

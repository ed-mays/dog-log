import { render, screen, waitFor } from '@/test-utils';
import { LoadingIndicator } from './LoadingIndicator';

test('renders default loading indicator', async () => {
  render(<LoadingIndicator />);
  await waitFor(() => {
    expect(screen.getByTestId('loading-indicator')).toHaveTextContent(
      'Loading…'
    );
  });
});

test('renders custom text', async () => {
  render(<LoadingIndicator text="Please wait..." />);
  await waitFor(() => {
    expect(screen.getByTestId('loading-indicator')).toHaveTextContent(
      'Please wait...'
    );
  });
});

test('renders with a custom test id', async () => {
  render(<LoadingIndicator data-testid="custom-indicator" />);
  await waitFor(() => {
    expect(screen.getByTestId('custom-indicator')).toBeInTheDocument();
  });
});

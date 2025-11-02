import { render, screen } from '@test-utils';
import { LoadingIndicator } from './LoadingIndicator';

// TODO: Implement test for i18n on default loading indicator for en and es locales
test('renders default loading indicator', async () => {
  render(<LoadingIndicator />);
  const status = await screen.findByRole('status');
  expect(status).toHaveTextContent('Loading…');
});

test('renders custom text', async () => {
  render(<LoadingIndicator text="Please wait..." />);
  const status = await screen.findByRole('status');
  expect(status).toHaveTextContent('Please wait...');
});

test('renders with a custom test id', async () => {
  render(<LoadingIndicator data-testid="custom-indicator" />);
  const status = await screen.findByRole('status');
  expect(status).toBeInTheDocument();
  expect(status).toHaveAttribute('data-testid', 'custom-indicator');
});

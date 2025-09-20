import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';

import { render, screen, waitFor } from '@testing-library/react';
import { test } from 'vitest';

test('renders the default eror indicator', async () => {
  render(<ErrorIndicator />);
  await waitFor(() => {
    expect(screen.getByTestId('error-indicator')).toHaveTextContent('Error...');
  });
});

test('renders custom text', async () => {
  render(<ErrorIndicator text="ERROR!" />);
  await waitFor(() => {
    expect(screen.getByTestId('error-indicator')).toHaveTextContent('ERROR!');
  });
});

test('renders with custom test-id', async () => {
  render(<ErrorIndicator data-testid="custom-test-id" />);
  await waitFor(() => {
    expect(screen.getByTestId('custom-test-id')).toBeTruthy();
  });
});

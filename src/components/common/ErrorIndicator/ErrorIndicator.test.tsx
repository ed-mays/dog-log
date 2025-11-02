import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';

import { render, screen } from '@test-utils';
import { describe, test } from 'vitest';

describe('ErrorIndicator', () => {
  // TODO: Implement test for i18n on default error indicator for en and es locales
  test('renders the default error indicator', async () => {
    render(<ErrorIndicator />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Error...');
  });

  test('renders custom text', async () => {
    render(<ErrorIndicator text="ERROR!" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('ERROR!');
  });

  test('renders with custom test-id', async () => {
    render(<ErrorIndicator data-testid="custom-test-id" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-testid', 'custom-test-id');
  });
});

import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';

import { render, screen, waitFor } from '@test-utils';
import { describe, test } from 'vitest';

describe('ErrorIndicator', () => {
  // TODO: Implement test for i18n on default error indicator for en and es locales
  test('renders the default error indicator', async () => {
    render(<ErrorIndicator />);
    await waitFor(() => {
      expect(screen.getByTestId('error-indicator')).toHaveTextContent(
        'Error...'
      );
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
});

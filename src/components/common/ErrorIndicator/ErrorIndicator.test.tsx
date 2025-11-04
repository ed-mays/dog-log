import { ErrorIndicator } from '@components/common/ErrorIndicator/ErrorIndicator';

import { render, screen, withLocale } from '@test-utils';
import { describe, test } from 'vitest';
import i18n from '@testUtils/test-i18n';

describe('ErrorIndicator', () => {
  test('renders the default error indicator (English)', async () => {
    await withLocale('en', async () => {
      render(<ErrorIndicator />);
      const alert = await screen.findByRole('alert');
      const expected = i18n.t('error', {
        ns: 'common',
        defaultValue: 'Error...',
      });
      expect(alert).toHaveTextContent(expected);
    });
  });

  test('renders the default error indicator (Spanish)', async () => {
    await withLocale('es', async () => {
      render(<ErrorIndicator />);
      const alert = await screen.findByRole('alert');
      const expected = i18n.t('error', {
        ns: 'common',
        defaultValue: 'Error...',
      });
      expect(alert).toHaveTextContent(expected);
    });
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

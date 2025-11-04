import React from 'react';
import { render, screen } from '@test-utils';
import { LoadingIndicator } from './LoadingIndicator';

// TDD: specify expected behavior of the new Material UI based LoadingIndicator

test('renders a progress spinner and a localized "Please Wait" message', () => {
  render(<LoadingIndicator />);

  // Root should expose polite status for screen readers
  const root = screen.getByTestId('loading-indicator');
  expect(root).toHaveAttribute('role', 'status');
  expect(root).toHaveAttribute('aria-live', 'polite');

  // Should render an indeterminate circular progress (MUI exposes role=progressbar)
  const spinner = screen.getByRole('progressbar');
  expect(spinner).toBeInTheDocument();

  // Localized default message text displayed underneath the spinner
  expect(screen.getByText('Please Wait')).toBeInTheDocument();
});

test('accepts custom text prop to override default localized label', () => {
  render(<LoadingIndicator text="Loading pets..." />);
  expect(screen.getByText('Loading pets...')).toBeInTheDocument();
});

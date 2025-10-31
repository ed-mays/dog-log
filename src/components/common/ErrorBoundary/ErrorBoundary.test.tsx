import React from 'react';
import { render, screen, withLocale } from '@test-utils';
import { ErrorBoundary } from './ErrorBoundary';

const Thrower: React.FC = () => {
  throw new Error('Boom');
};

describe('ErrorBoundary', () => {
  it('renders a localized fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        {/* Throwing component should be caught by boundary */}
        <Thrower />
      </ErrorBoundary>
    );
    const fallback = screen.getByTestId('error-boundary-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('Something went wrong');
  });

  it('renders Spanish fallback when locale is es', async () => {
    await withLocale('es', async () => {
      render(
        <ErrorBoundary>
          <Thrower />
        </ErrorBoundary>
      );
      const fallback = screen.getByTestId('error-boundary-fallback');
      expect(fallback).toHaveTextContent('Algo salió mal');
    });
  });
});

import React from 'react';
import { render, screen } from '@/test-utils';
import i18n from '@testUtils/test-i18n';
import { ErrorBoundary } from './ErrorBoundary';

const Thrower: React.FC = () => {
  throw new Error('Boom');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('renders a localized fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        {/* Throwing component should be caught by boundary */}
        <Thrower />
      </ErrorBoundary>,
      { i18nInstance: i18n }
    );
    const fallback = screen.getByTestId('error-boundary-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('Something went wrong');
  });

  it('renders Spanish fallback when locale is es', () => {
    i18n.changeLanguage('es');
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>,
      { i18nInstance: i18n }
    );
    const fallback = screen.getByTestId('error-boundary-fallback');
    expect(fallback).toHaveTextContent('Algo salió mal');
  });
});

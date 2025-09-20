/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { useTranslation } from 'react-i18next';

export type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackText?: string;
  'data-testid'?: string;
};

// Functional fallback content to access i18n inside a class ErrorBoundary
function FallbackContent({
  text,
  'data-testid': dataTestId = 'error-boundary-fallback',
}: {
  text?: string;
  'data-testid'?: string;
}) {
  const { t } = useTranslation('common');
  const label = text ?? t('somethingWentWrong', 'Something went wrong');
  return (
    <div role="alert" aria-live="assertive" data-testid={dataTestId}>
      {label}
    </div>
  );
}

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(_error: unknown, _info: unknown) {
    // Can log to an error reporting service if needed
  }

  render() {
    const { children, fallbackText, 'data-testid': dataTestId } = this.props;
    if (this.state.hasError) {
      return <FallbackContent text={fallbackText} data-testid={dataTestId} />;
    }
    return children;
  }
}

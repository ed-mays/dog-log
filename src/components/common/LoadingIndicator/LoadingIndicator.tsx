import { useTranslation } from 'react-i18next';

export type LoadingIndicatorProps = {
  text?: string; // optional override of localized default
  role?: React.AriaRole; // a11y role
  ariaLive?: 'polite' | 'assertive' | 'off';
  'data-testid'?: string;
};

export function LoadingIndicator({
  text,
  role = 'status',
  ariaLive = 'polite',
  'data-testid': dataTestId = 'loading-indicator',
}: LoadingIndicatorProps) {
  const { t } = useTranslation('common');
  const label = text ?? t('loading', 'Loading…');
  return (
    <div data-testid={dataTestId} role={role} aria-live={ariaLive}>
      {label}
    </div>
  );
}

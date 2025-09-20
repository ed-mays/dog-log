import { useTranslation } from 'react-i18next';

export type ErrorIndicatorProps = {
  text?: string; // optional override of localized default
  role?: React.AriaRole; // a11y role
  ariaLive?: 'polite' | 'assertive' | 'off';
  'data-testid'?: string;
};

export function ErrorIndicator({
  text,
  role = 'alert',
  ariaLive = 'assertive',
  'data-testid': dataTestId = 'error-indicator',
}: ErrorIndicatorProps) {
  const { t } = useTranslation('common');
  const label = text ?? t('error', 'Error...');
  return (
    <div data-testid={dataTestId} role={role} aria-live={ariaLive}>
      {label}
    </div>
  );
}

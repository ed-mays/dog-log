import { useTranslation } from 'react-i18next';
import { Alert } from '@mui/material';

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
    <Alert
      severity="error"
      data-testid={dataTestId}
      role={role}
      aria-live={ariaLive}
    >
      {label}
    </Alert>
  );
}

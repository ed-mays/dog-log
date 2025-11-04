import { useTranslation } from 'react-i18next';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

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
  const label = text ?? t('pleaseWait', 'Please Wait');
  return (
    <Stack
      data-testid={dataTestId}
      role={role}
      aria-live={ariaLive}
      direction="column"
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: '100vh', width: '100%' }}
    >
      <CircularProgress variant="indeterminate" />
      <Typography variant="body1">{label}</Typography>
    </Stack>
  );
}

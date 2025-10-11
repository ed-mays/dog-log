//import { useTranslation } from 'react-i18next';

export type NavigationBarProps = {
  text?: string; // optional override of localized default
  role?: React.AriaRole; // a11y role
  ariaLive?: 'polite' | 'assertive' | 'off';
  'data-testid'?: string;
};

export function NavigationBar({
  text,
  role = 'status',
  ariaLive = 'polite',
  'data-testid': dataTestId = 'loading-indicator',
}: NavigationBarProps) {
  //const { t } = useTranslation('common');
  //const label = text ?? t('loading', 'Loading…');
  const label = text ?? 'Navigation Bar';
  return (
    <div data-testid={dataTestId} role={role} aria-live={ariaLive}>
      {label}
    </div>
  );
}

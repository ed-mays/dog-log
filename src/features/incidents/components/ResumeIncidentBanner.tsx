import { useEffect, useState } from 'react';
import { Alert, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '@store/useIncidentStore';

const DISMISS_KEY = 'incidents.resumeBanner.dismissed';

// DQ-2: persistent banner offering to resume an active incident.
// Hidden on `/incidents/active` (T-30 spec — caregiver is already there).
// Dismissible per-session via sessionStorage (T-30 spec — survives nav,
// not browser-tab-close). Does NOT auto-navigate.
export function ResumeIncidentBanner() {
  const { t } = useTranslation('common');
  const activeIncident = useIncidentStore((s) => s.activeIncident);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed());

  useEffect(() => {
    if (dismissed) sessionStorage.setItem(DISMISS_KEY, '1');
  }, [dismissed]);

  if (
    !activeIncident ||
    activeIncident.endedAt !== null ||
    dismissed ||
    pathname === '/incidents/active'
  ) {
    return null;
  }

  return (
    <Alert severity="warning" onClose={() => setDismissed(true)}>
      {t('incidents.resumeBanner.message')}{' '}
      <Button
        color="inherit"
        size="small"
        onClick={() => navigate('/incidents/active')}
      >
        {t('incidents.resumeBanner.action')}
      </Button>
    </Alert>
  );
}

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

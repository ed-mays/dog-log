import { useState } from 'react';
import { Alert, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '@store/useIncidentStore';

// DQ-2: persistent banner offering to resume an active incident.
// Dismissible per-session only — the active incident is not gone until STOP or delete.
// Does NOT auto-navigate; caregiver may have opened the app for something else.
export function ResumeIncidentBanner() {
  const { t } = useTranslation('common');
  const activeIncident = useIncidentStore((s) => s.activeIncident);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (!activeIncident || activeIncident.endedAt !== null || dismissed) {
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

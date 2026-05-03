import { Box, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIncidentStore } from '@store/useIncidentStore';
import type { Incident, Severity } from '@features/incidents/types';

// BR-6: severity is settable, changeable, and clearable by single-tap chip
// interaction. §D9: MUI Chip with role="button" and aria-pressed. NFR-3: 44×44
// minimum tap target.

const SEVERITIES: Severity[] = ['mild', 'moderate', 'severe'];

interface SeverityChipsProps {
  incident: Incident;
}

export function SeverityChips({ incident }: SeverityChipsProps) {
  const { t } = useTranslation();
  const { setSeverity, clearSeverity } = useIncidentStore();

  const handleTap = (severity: Severity) => {
    if (incident.severity === severity) {
      void clearSeverity();
    } else {
      void setSeverity(severity);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {SEVERITIES.map((severity) => {
        const selected = incident.severity === severity;
        return (
          <Chip
            key={severity}
            label={t(`incidents.severity.${severity}`)}
            onClick={() => handleTap(severity)}
            aria-pressed={selected}
            color={selected ? 'primary' : 'default'}
            sx={{ minHeight: 44, minWidth: 44 }}
          />
        );
      })}
    </Box>
  );
}

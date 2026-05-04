import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useIncidentHistory } from '../hooks/useIncidentHistory';
import type { Incident } from '../types';

function formatDuration(incident: Incident): string {
  if (!incident.endedAt) return '—';
  const seconds = Math.floor(
    (incident.endedAt.getTime() - incident.startedAt.getTime()) / 1000
  );
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

interface IncidentHistoryListProps {
  petId: string;
}

// Per §D2 / BR-23, BR-24, BR-25: per-pet incident list, most-recent-first.
// Owns its own data-fetch via useIncidentHistory; receives only petId as prop.
export function IncidentHistoryList({ petId }: IncidentHistoryListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { incidents, loading, error } = useIncidentHistory(petId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" role="alert">
        {error}
      </Typography>
    );
  }

  if (incidents.length === 0) {
    return (
      <Typography color="text.secondary">
        {t('incidents.history.empty')}
      </Typography>
    );
  }

  return (
    <List>
      {incidents.map((incident) => {
        const typeLabel = incident.type ?? t('incidents.history.untyped');
        const journalExcerpt = incident.journal[0]?.text ?? '';
        const secondary = [
          formatDuration(incident),
          incident.severity ?? '',
          journalExcerpt,
        ]
          .filter(Boolean)
          .join(' · ');

        return (
          <ListItemButton
            key={incident.id}
            onClick={() => navigate(`/pets/${petId}/incidents/${incident.id}`)}
          >
            <ListItemText
              primary={`${incident.startedAt.toLocaleString()} · ${typeLabel}`}
              secondary={secondary || undefined}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

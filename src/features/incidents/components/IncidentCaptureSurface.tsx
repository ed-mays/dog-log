import { Box } from '@mui/material';
import { IncidentTimer } from './IncidentTimer';
import { StopButton } from './StopButton';
import { SeverityChips } from './SeverityChips';
import { ObservationChips } from './ObservationChips';
import { IncidentJournal } from './IncidentJournal';
import { VetCallCard } from './VetCallCard';
import type { Incident } from '@features/incidents/types';

interface IncidentCaptureSurfaceProps {
  incident: Incident;
}

// Shared surface for both live (endedAt === null) and post-stop views (BR-14,
// BR-25). StopButton is only rendered while the incident is active.
export function IncidentCaptureSurface({
  incident,
}: IncidentCaptureSurfaceProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <IncidentTimer
        startedAt={incident.startedAt}
        endedAt={incident.endedAt}
      />
      {incident.endedAt === null && <StopButton />}
      <SeverityChips incident={incident} />
      <ObservationChips incident={incident} />
      <IncidentJournal />
      <VetCallCard petId={incident.petId} />
    </Box>
  );
}

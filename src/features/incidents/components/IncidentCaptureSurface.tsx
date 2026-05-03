import { Box } from '@mui/material';
import { IncidentTimer } from './IncidentTimer';
import { StopButton } from './StopButton';
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
    <Box>
      <IncidentTimer startedAt={incident.startedAt} />
      {incident.endedAt === null && <StopButton />}
    </Box>
  );
}

import { Box } from '@mui/material';
import { useIncidentTimer } from '@features/incidents/hooks/useIncidentTimer';

interface IncidentTimerProps {
  startedAt: Date;
  endedAt?: Date | null;
}

// Per design §D9: monospace digits (no jitter), aria-live="polite" on the
// elapsed text only — milliseconds are intentionally absent so screen
// readers don't get flooded.
//
// §D2 post-STOP invariant: endedAt freezes the displayed elapsed.
export function IncidentTimer({
  startedAt,
  endedAt = null,
}: IncidentTimerProps) {
  const elapsed = useIncidentTimer(startedAt, endedAt);

  return (
    <Box
      component="span"
      aria-live="polite"
      sx={{
        fontFamily: 'monospace',
        fontVariantNumeric: 'tabular-nums',
        fontSize: '2.5rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}
    >
      {elapsed}
    </Box>
  );
}

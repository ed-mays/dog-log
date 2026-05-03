import { useState, useEffect } from 'react';
import { incidentService } from '@services/incidentService';
import { useAuthStore } from '@store/auth.store';
import type { Incident } from '@features/incidents/types';

// Loads a single saved incident by id for SavedIncidentPage (§D2, BR-23, BR-25).
// Returns undefined while loading, null when not found, or the Incident when found.
export function useSavedIncident(
  incidentId: string | undefined
): Incident | null | undefined {
  const userId = useAuthStore((s) => s.user?.uid);
  const [incident, setIncident] = useState<Incident | null | undefined>(
    undefined
  );

  useEffect(() => {
    if (!userId || !incidentId) {
      setIncident(null);
      return;
    }
    incidentService
      .getIncident(userId, incidentId)
      .then(setIncident)
      .catch(() => setIncident(null));
  }, [userId, incidentId]);

  return incident;
}

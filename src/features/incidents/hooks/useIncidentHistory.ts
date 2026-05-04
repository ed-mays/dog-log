import { useState, useEffect } from 'react';
import { incidentService } from '@services/incidentService';
import { useAuthStore } from '@store/auth.store';
import type { Incident } from '@features/incidents/types';

export interface UseIncidentHistoryResult {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
}

// Per §D2 Component → Hook → Service layering (BR-23, BR-24, BR-25).
// Loads the per-pet incident list from the service; soft-delete exclusion
// and sort are enforced at the repository query layer.
export function useIncidentHistory(petId: string): UseIncidentHistoryResult {
  const userId = useAuthStore((s) => s.user?.uid);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    incidentService
      .listForPet(userId, petId)
      .then((data) => {
        setIncidents(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Failed to load incidents'
        );
        setLoading(false);
      });
  }, [userId, petId]);

  return { incidents, loading, error };
}

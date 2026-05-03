import { Navigate, useParams } from 'react-router-dom';
import { useSavedIncident } from '../hooks/useSavedIncident';
import { IncidentCaptureSurface } from '../components/IncidentCaptureSurface';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';

// /pets/:petId/incidents/:incidentId route (§D2, BR-23, BR-25).
// Redirects to /pets if incident is not found or petId doesn't match.
export default function SavedIncidentPage() {
  const { petId, incidentId } = useParams<{
    petId: string;
    incidentId: string;
  }>();
  const incident = useSavedIncident(incidentId);

  if (incident === undefined) {
    return <LoadingIndicator />;
  }

  if (!incident || incident.petId !== petId) {
    return <Navigate to="/pets" replace />;
  }

  return <IncidentCaptureSurface incident={incident} />;
}

import { Navigate } from 'react-router-dom';
import { useIncidentStore } from '@store/useIncidentStore';
import { IncidentCaptureSurface } from '../components/IncidentCaptureSurface';

// /incidents/active route — loads activeIncident from store, renders the
// shared capture surface (§D2). Redirects to /pets if no active incident.
export default function ActiveIncidentPage() {
  const { activeIncident } = useIncidentStore();

  if (!activeIncident) {
    return <Navigate to="/pets" replace />;
  }

  return <IncidentCaptureSurface incident={activeIncident} />;
}

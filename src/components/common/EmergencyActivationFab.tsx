import { useState } from 'react';
import { Fab } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';
import { useIncidentStore } from '@store/useIncidentStore';
import { usePetsStore } from '@store/pets.store';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { ActivationPetPicker } from '@features/incidents/components/ActivationPetPicker';

// Global emergency activation FAB (BR-27, AC-18).
// Mounts outside the route tree in App.tsx so it survives navigation.
// Hidden conditions per §D2: unauthenticated, on /incidents/active, flag off, zero pets.
export function EmergencyActivationFab() {
  const { t } = useTranslation('common');
  const incidentsEnabled = useFeatureFlag('incidentsEnabled');
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  const { activeIncident, startIncident } = useIncidentStore();
  const pets = usePetsStore((s) => s.pets);
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (
    !incidentsEnabled ||
    !user ||
    pathname === '/incidents/active' ||
    pets.length === 0
  ) {
    return null;
  }

  const handleTap = () => {
    // BR-26: active incident already exists — resume it, don't start a new one
    if (activeIncident) {
      navigate('/incidents/active');
      return;
    }

    // BR-28: petId resolution — route param wins, then single-pet auto-select
    const petId = params.id ?? (pets.length === 1 ? pets[0].id : null);
    if (petId) {
      // §D8 NFR-2: startIncident sets activeIncident synchronously before
      // the background Firestore write; navigate immediately after the call
      void startIncident({ petId });
      navigate('/incidents/active');
    } else {
      // BR-28 third rule: multi-pet, non-pet-scoped → open picker; selecting a pet IS the activation
      setPickerOpen(true);
    }
  };

  return (
    <>
      <Fab
        color="error"
        aria-label={t('incidents.activate')}
        onClick={handleTap}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: 56,
          height: 56,
        }}
      >
        <WarningIcon />
      </Fab>
      <ActivationPetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

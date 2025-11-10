import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import VetForm, {
  type VetFormValues,
} from '@features/veterinarians/components/VetForm';
import { vetService } from '@services/vetService';
import { useAuthStore } from '@store/auth.store';

export default function AddVetPage() {
  const { t } = useTranslation('veterinarians');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);

  const initialValues: VetFormValues = useMemo(
    () => ({
      name: '',
      phone: '',
      email: '',
      website: '',
      clinicName: '',
      address: {},
      specialties: [],
      notes: '',
    }),
    []
  );

  useEffect(() => {
    setError(null);
  }, []);

  async function handleSubmit(values: VetFormValues) {
    setError(null);
    if (!user?.uid) return; // guarded by auth at routing level
    try {
      await vetService.createVet(user.uid, user.uid, {
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        website: values.website || undefined,
        clinicName: values.clinicName || undefined,
        address: values.address,
        specialties: values.specialties,
        notes: values.notes || undefined,
      });
      // UI telemetry on successful submit
      try {
        const { track } = await import('@services/analytics/analytics');
        track('vet_created');
      } catch {
        // Swallow analytics errors; non-critical side effect
      }
      navigate('/vets');
    } catch (err) {
      // detect duplicate error by code
      const code = (err as { code?: string } | null)?.code;
      if (code === 'DUPLICATE_VET') {
        setError(t('error.duplicate'));
      } else {
        setError(t('common:somethingWentWrong', 'Something went wrong'));
      }
    }
  }

  function handleCancel() {
    navigate('/vets');
  }

  return (
    <Box sx={{ p: 2 }} aria-label="add veterinarian page">
      <VetForm
        title={t('actions.add')}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        errorMessage={error}
        submitLabel={t('actions.add')}
      />
    </Box>
  );
}

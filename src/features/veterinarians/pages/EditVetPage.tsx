import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Typography } from '@mui/material';
import VetForm, {
  type VetFormValues,
} from '@features/veterinarians/components/VetForm';
import { useEditVet } from '../hooks/useEditVet';
import { useAuthStore } from '@store/auth.store';

export default function EditVetPage() {
  const { t } = useTranslation('veterinarians');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const params = useParams<{ id: string }>();
  const id = params.id!;
  const [error, setError] = useState<string | null>(null);
  const { vet, loading, loadError, updateVet } = useEditVet(user?.uid, id);

  useEffect(() => {
    if (loadError) {
      setError(t('common:somethingWentWrong', 'Something went wrong'));
    }
  }, [loadError, t]);

  const initialValues: VetFormValues | null = useMemo(() => {
    if (!vet) return null;
    return {
      name: vet.name,
      phone: vet.phone,
      email: vet.email,
      website: vet.website,
      clinicName: vet.clinicName,
      address: vet.address,
      specialties: vet.specialties,
      notes: vet.notes,
    };
  }, [vet]);

  async function handleSubmit(values: VetFormValues) {
    setError(null);
    if (!user?.uid) return;
    try {
      await updateVet({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        website: values.website || undefined,
        clinicName: values.clinicName || undefined,
        address: values.address,
        specialties: values.specialties,
        notes: values.notes || undefined,
      });

      navigate('/vets');
    } catch (err) {
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
    <Box sx={{ p: 2 }} aria-label="edit veterinarian page">
      <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
        {t('actions.edit')}
      </Typography>
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography component="span">
            {t('common:loading', 'Loading…')}
          </Typography>
        </Box>
      )}
      {!loading && !vet && (
        <Typography variant="body1">
          {t('common:somethingWentWrong', 'Something went wrong')}
        </Typography>
      )}
      {!loading && vet && initialValues && (
        <VetForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          errorMessage={error}
          submitLabel={t('actions.edit')}
        />
      )}
    </Box>
  );
}

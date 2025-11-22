import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Link, Typography } from '@mui/material';
import { LinkedVetList } from '@features/pets/components/LinkedVetList';
import { PetInfoTable } from '@features/pets/components/PetInfoTable';
import { PetActions } from '@features/pets/components/PetActions';
import { usePetDetails } from '@features/pets/hooks/usePetDetails';

export default function PetDetailsPage() {
  const { t } = useTranslation('common');
  const {
    pet,
    vetLinks,
    loadingVets,
    saving,
    error,
    vetsEnabled,
    vetLinkingEnabled,
    petActionsEnabled,
    handleDelete,
    navigate,
    nsReady,
  } = usePetDetails();

  if (!nsReady) return null;

  if (!pet) {
    return (
      <Alert severity="warning" role="alert">
        {t('notFound', { defaultValue: 'Not found' })}
      </Alert>
    );
  }

  return (
    <div>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('details', { defaultValue: 'Details' })}
      </Typography>

      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {saving && (
        <Alert severity="info" role="alert" sx={{ mb: 2 }}>
          {t('saving', { defaultValue: 'Saving...' })}
        </Alert>
      )}

      <PetInfoTable pet={pet} />

      {vetsEnabled && vetLinkingEnabled && (
        <div style={{ marginTop: '2rem' }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t('linkedVeterinarians', {
              ns: 'veterinarians',
              defaultValue: 'Linked Veterinarians',
            })}
          </Typography>
          <LinkedVetList loading={loadingVets} links={vetLinks} />
        </div>
      )}

      {petActionsEnabled && (
        <PetActions
          pet={pet}
          onEdit={() => navigate(`/pets/${pet.id}/edit`)}
          onDelete={handleDelete}
          deleteError={error}
          isDeleting={saving}
        />
      )}

      <div style={{ marginTop: '1rem' }}>
        <Link component={RouterLink} to="/pets">
          {t('back', { defaultValue: 'Back' })}
        </Link>
      </div>
    </div>
  );
}

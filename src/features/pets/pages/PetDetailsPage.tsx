import { useEffect, useMemo, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadNamespace } from '@i18n';
import { usePetsStore } from '@store/pets.store.ts';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.ts';
import {
  Alert,
  Button,
  Link,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Typography,
} from '@mui/material';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal.tsx';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function PetDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nsReady, setNsReady] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('petProperties'), loadNamespace('common')]).then(
      () => {
        if (mounted) setNsReady(true);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const pets = usePetsStore((s) => s.pets);
  const deletePet = usePetsStore((s) => s.deletePet);
  const pet = useMemo(() => pets.find((p) => p.id === id), [pets, id]);

  const { t } = useTranslation();
  const petActionsEnabled = useFeatureFlag('petActionsEnabled');

  if (!nsReady) return null;

  async function confirmDelete() {
    if (!pet) return;
    setSaving(true);
    setError(null);
    try {
      await deletePet(pet.id);
      navigate('/pets');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setError(t('errors.deleteFailed', { ns: 'common' }));
    } finally {
      setSaving(false);
      setDeleting(false);
    }
  }

  if (!pet) {
    return (
      <Alert severity="warning" role="alert">
        {t('notFound', { ns: 'common', defaultValue: 'Not found' })}
      </Alert>
    );
  }

  return (
    <div>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('details', { ns: 'common', defaultValue: 'Details' })}
      </Typography>

      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {saving && (
        <Alert severity="info" role="alert" sx={{ mb: 2 }}>
          {t('saving', { ns: 'common', defaultValue: 'Saving...' })}
        </Alert>
      )}

      <Table sx={{ maxWidth: 600, margin: '0 auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>
              {t('property', { ns: 'common', defaultValue: 'Property' })}
            </TableCell>
            <TableCell>
              {t('value', { ns: 'common', defaultValue: 'Value' })}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>{t('name', { ns: 'petProperties' })}</TableCell>
            <TableCell>{pet.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('breed', { ns: 'petProperties' })}</TableCell>
            <TableCell>{pet.breed}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {petActionsEnabled && (
        <div style={{ marginTop: '1rem' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/pets/${pet.id}/edit`)}
            startIcon={<EditIcon fontSize="small" />}
          >
            {t('edit', { ns: 'common' })}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleting(true)}
            sx={{ ml: 1 }}
            startIcon={<DeleteIcon fontSize="small" />}
          >
            {t('delete', { ns: 'common' })}
          </Button>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <Link component={RouterLink} to="/pets">
          {t('back', { ns: 'common', defaultValue: 'Back' })}
        </Link>
      </div>

      {deleting && (
        <ConfirmModal
          text={t('confirmDeleteMessage', {
            ns: 'common',
            petName: pet.name,
          })}
          onAccept={confirmDelete}
          onDecline={() => setDeleting(false)}
          error={error}
        />
      )}
    </div>
  );
}

import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Pet } from '@features/pets/types';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.ts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal.tsx';
import { usePetsStore } from '@store/pets.store.ts';

// Basic Material UI PetCard structure
// - Container wraps the card (per MUI docs guidance)
// - Header image
// - Displays provided pet name and breed
// - Clicking the card navigates to the PetDetailsPage for the pet
export function PetCard({ pet }: { pet: Pet }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const petActionsEnabled = useFeatureFlag('petActionsEnabled');
  const deletePet = usePetsStore((s) => s.deletePet);

  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setSaving(true);
    setError(null);
    try {
      await deletePet(pet.id);
      // stay on the list; item will disappear via store update
    } catch {
      setError(t('errors.deleteFailed', { ns: 'common' }));
    } finally {
      setSaving(false);
      setDeleting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 345 }}>
      <Card>
        {error && (
          <Alert severity="error" role="alert" sx={{ m: 1 }}>
            {error}
          </Alert>
        )}
        {saving && (
          <Alert severity="info" role="alert" sx={{ m: 1 }}>
            {t('saving', { ns: 'common', defaultValue: 'Saving...' })}
          </Alert>
        )}
        <CardActionArea component={RouterLink} to={`/pets/${pet.id}`}>
          <CardMedia
            component="img"
            height="140"
            image="https://placehold.co/345x140?text=Pet+Image"
            alt="pet header"
          />
          <CardContent>
            <Typography gutterBottom variant="h6" component="h3">
              {pet.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pet.breed}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          {petActionsEnabled && (
            <>
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
            </>
          )}
        </CardActions>
      </Card>

      {deleting && (
        <ConfirmModal
          text={t('confirmDeleteMessage', { ns: 'common', petName: pet.name })}
          onAccept={confirmDelete}
          onDecline={() => setDeleting(false)}
          error={error}
        />
      )}
    </Box>
  );
}

export default PetCard;

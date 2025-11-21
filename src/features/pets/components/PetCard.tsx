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
  Chip,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Pet } from '@features/pets/types';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal';
import { usePetsStore } from '@store/pets.store';
import { useAuthStore } from '@store/auth.store';
import { petVetService } from '@services/petVetService';
import type { PetVetLink, Vet } from '@models/vets';
import { logger } from '@services/logService';

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
  const user = useAuthStore((s) => s.user);

  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vetLinks, setVetLinks] = useState<
    Array<{ link: PetVetLink; vet: Vet }>
  >([]);

  // Feature flags for vet display
  let vetsEnabled = false;
  let vetLinkingEnabled = false;
  try {
    vetsEnabled = useFeatureFlag('vetsEnabled');
    vetLinkingEnabled = useFeatureFlag('vetLinkingEnabled');
  } catch {
    // In environments without FeatureFlagsProvider, default to false
    logger.info('Vet feature flags not available, defaulting to false');
  }

  // Load vet links when flags are enabled
  useEffect(() => {
    let mounted = true;

    async function loadVetLinks() {
      if (!user?.uid || !pet.id || !(vetsEnabled && vetLinkingEnabled)) return;

      try {
        const links = await petVetService.getPetVets(user.uid, pet.id);
        if (mounted) setVetLinks(links);
      } catch (err) {
        // Swallow errors silently - vet display is secondary to pet card
        logger.debug('Failed to load vet links for PetCard', { error: err });
      }
    }

    loadVetLinks();
    return () => {
      mounted = false;
    };
  }, [user?.uid, pet.id, vetsEnabled, vetLinkingEnabled]);

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
            {vetsEnabled && vetLinkingEnabled && vetLinks.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {vetLinks.map(({ link, vet }) => {
                  const roleKey = `link.role.${link.role}` as const;
                  const label = `${vet.name} — ${t(roleKey, { ns: 'veterinarians' })}`;
                  return (
                    <Chip
                      key={link.id}
                      label={label}
                      size="small"
                      variant="outlined"
                      role="listitem"
                    />
                  );
                })}
              </Box>
            )}
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

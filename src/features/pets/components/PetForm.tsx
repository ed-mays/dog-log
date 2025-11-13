import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import formStyles from '@styles/FormStyles.module.css';
import type { Pet } from '@features/pets/types';
import { loadNamespace } from '@i18n';
import {
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useAuthStore } from '@store/auth.store';
import VetSelector from '@features/veterinarians/components/VetSelector';
import { petVetService } from '@services/petVetService';
import type { PetVetLink, Vet } from '@models/vets';
import DeleteIcon from '@mui/icons-material/Close';

interface PetFormProps {
  initialValues: Pet;
  onSubmit: (pet: Pet) => void | Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  value?: Pet; // controlled current value (optional)
  onChange?: (pet: Pet) => void; // controlled change handler (optional)
}

export function PetForm({
  initialValues,
  onSubmit,
  onCancel,
  onDirtyChange,
  value,
  onChange,
}: PetFormProps) {
  const [nsReady, setNsReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('common'), loadNamespace('petProperties')]).then(
      () => {
        if (mounted) setNsReady(true);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const [internalPet, setInternalPet] = useState<Pet>(initialValues);
  const pet: Pet = value ?? internalPet;

  useEffect(() => {
    const dirty =
      pet.name !== initialValues.name || pet.breed !== initialValues.breed;
    onDirtyChange?.(dirty);
  }, [pet, initialValues, onDirtyChange]);

  const { t } = useTranslation();
  let vetsEnabled = false;
  let vetLinkingEnabled = false;
  try {
    vetsEnabled = useFeatureFlag('vetsEnabled');
    vetLinkingEnabled = useFeatureFlag('vetLinkingEnabled');
  } catch {
    // In tests or environments without FeatureFlagsProvider, default flags to false
    vetsEnabled = false;
    vetLinkingEnabled = false;
  }
  const user = useAuthStore((s) => s.user);
  const userId = user?.uid ?? '';

  const [links, setLinks] = useState<Array<{ link: PetVetLink; vet: Vet }>>([]);
  const [, setLoadingLinks] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadLinks() {
      if (!userId || !initialValues.id || !(vetsEnabled && vetLinkingEnabled))
        return;
      setLoadingLinks(true);
      try {
        const data = await petVetService.getPetVets(userId, initialValues.id);
        if (active) setLinks(data);
      } finally {
        if (active) setLoadingLinks(false);
      }
    }
    loadLinks();
    return () => {
      active = false;
    };
  }, [userId, initialValues.id, vetsEnabled, vetLinkingEnabled]);

  if (!nsReady) return null;

  const isValid = pet.name.trim().length > 0 && pet.breed.trim().length > 0;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value: nextVal } = e.target;
    const nextPet = { ...pet, [name]: nextVal } as Pet;
    if (onChange) {
      onChange(nextPet);
    } else {
      setInternalPet(nextPet);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) await onSubmit(pet);
  }

  return (
    <form className={formStyles.formRoot} onSubmit={handleSubmit}>
      <div className={formStyles.formGroup}>
        <TextField
          id="pet-name"
          name="name"
          label={t('name', { ns: 'petProperties' })}
          value={pet.name}
          onChange={handleChange}
          required
          fullWidth
          size="small"
        />
      </div>
      <div className={formStyles.formGroup}>
        <TextField
          id="pet-breed"
          name="breed"
          label={t('breed', { ns: 'petProperties' })}
          value={pet.breed}
          onChange={handleChange}
          required
          fullWidth
          size="small"
        />
      </div>
      {vetsEnabled && vetLinkingEnabled && initialValues.id ? (
        <Box
          className={formStyles.formGroup}
          aria-label={t('link.sectionTitle', { ns: 'veterinarians' })}
        >
          <Typography variant="subtitle1" component="h2" gutterBottom>
            {t('link.sectionTitle', { ns: 'veterinarians' })}
          </Typography>
          <Box sx={{ mb: 1 }}>
            <VetSelector
              label={t('link.add', { ns: 'veterinarians' })}
              onSelect={async (vet: Vet) => {
                if (!userId || !initialValues.id) return;
                const link = await petVetService.linkVetToPet(
                  userId,
                  initialValues.id,
                  vet.id
                );
                setLinks((prev) => [...prev, { link, vet }]);
                // telemetry
                try {
                  const { track } = await import(
                    '@services/analytics/analytics'
                  );
                  track('vet_link_created');
                } catch {
                  /* no-op: analytics is optional */
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {links.map(({ link, vet }) => {
              const roleKey = `link.role.${link.role}` as const;
              const label = `${vet.name} — ${t(roleKey, { ns: 'veterinarians' })}`;
              return (
                <Chip
                  key={link.id}
                  label={label}
                  role="listitem"
                  onDelete={async () => {
                    if (!userId) return;
                    await petVetService.unlinkVetFromPet(userId, link.id);
                    setLinks((prev) =>
                      prev.filter((l) => l.link.id !== link.id)
                    );
                    try {
                      const { track } = await import(
                        '@services/analytics/analytics'
                      );
                      track('vet_link_deleted');
                    } catch {
                      /* no-op: analytics is optional */
                    }
                  }}
                  deleteIcon={
                    <IconButton
                      aria-label={t('link.remove', { ns: 'veterinarians' })}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                />
              );
            })}
          </Box>
        </Box>
      ) : null}

      <div className={formStyles.formActions}>
        <Button
          className={formStyles.formButton}
          type="button"
          onClick={onCancel}
        >
          {t('responses.cancel', { ns: 'common' })}
        </Button>
        <Button
          className={`${formStyles.formButton} ${formStyles.formButtonPrimary}`}
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isValid}
        >
          {t('responses.ok', { ns: 'common' })}
        </Button>
      </div>
    </form>
  );
}

export type { Pet } from '@features/pets/types';

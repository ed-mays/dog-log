import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Close';

import formStyles from '@styles/FormStyles.module.css';
import { loadNamespace } from '@i18n';
import { logger } from '@services/logService';

import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useAuthStore } from '@store/auth.store';
import VetSelector from '@features/veterinarians/components/VetSelector';
import { usePetVets } from '@features/pets/hooks/usePetVets';
import type { Vet, PetVetRole } from '@models/vets';
import type { Pet } from '@features/pets/types';

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
  const [internalPet, setInternalPet] = useState<Pet>(initialValues);
  const pet: Pet = value ?? internalPet;
  const { t } = useTranslation();
  let vetsEnabled = false;
  let vetLinkingEnabled = false;

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

  useEffect(() => {
    const dirty =
      pet.name !== initialValues.name || pet.breed !== initialValues.breed;
    onDirtyChange?.(dirty);
  }, [pet, initialValues, onDirtyChange]);

  try {
    vetsEnabled = useFeatureFlag('vetsEnabled');
    vetLinkingEnabled = useFeatureFlag('vetLinkingEnabled');
  } catch {
    // In tests or environments without FeatureFlagsProvider, default flags to false
    logger.info('exception loading vet feature flags, defaulting to false');
    vetsEnabled = false;
    vetLinkingEnabled = false;
  }
  const user = useAuthStore((s) => s.user);
  const userId = user?.uid ?? '';

  const { links, linkVet, unlinkVet, setPrimaryVet, updateLinkRole } =
    usePetVets(userId || undefined, initialValues.id, {
      enabled: vetsEnabled && vetLinkingEnabled && !!initialValues.id,
    });

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
          <Box sx={{ mb: 2 }}>
            <VetSelector
              label={t('link.add', { ns: 'veterinarians' })}
              onSelect={async (vet: Vet) => {
                if (!userId || !initialValues.id) return;
                await linkVet(vet.id, vet);
                logger.debug('Vet linked to pet', { vet });
              }}
            />
          </Box>
          {links.length > 0 && (
            <List disablePadding>
              {links.map(({ link, vet }) => (
                <ListItem
                  key={link.id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    mb: 1,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <ListItemText
                    primary={vet.name}
                    secondary={vet.clinicName}
                    sx={{ flex: '1 1 auto', mr: 2 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel id={`role-label-${link.id}`}>
                        {t('link.role.label', { ns: 'veterinarians' })}
                      </InputLabel>
                      <Select
                        labelId={`role-label-${link.id}`}
                        id={`role-select-${link.id}`}
                        value={link.role}
                        label={t('link.role.label', { ns: 'veterinarians' })}
                        onChange={async (e) => {
                          const newRole = e.target.value as PetVetRole;
                          if (
                            newRole === link.role ||
                            !userId ||
                            !initialValues.id
                          )
                            return;

                          // Store handles optimistic update + rollback on error.
                          if (newRole === 'primary') {
                            await setPrimaryVet(link.id);
                          } else {
                            await updateLinkRole(link.id, newRole);
                          }
                        }}
                      >
                        <MenuItem value="primary">
                          {t('link.role.primary', { ns: 'veterinarians' })}
                        </MenuItem>
                        <MenuItem value="specialist">
                          {t('link.role.specialist', { ns: 'veterinarians' })}
                        </MenuItem>
                        <MenuItem value="emergency">
                          {t('link.role.emergency', { ns: 'veterinarians' })}
                        </MenuItem>
                        <MenuItem value="other">
                          {t('link.role.other', { ns: 'veterinarians' })}
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      edge="end"
                      aria-label={t('link.remove', { ns: 'veterinarians' })}
                      onClick={async () => {
                        if (!userId) return;
                        await unlinkVet(link.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
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

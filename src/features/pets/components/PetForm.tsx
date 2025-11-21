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
import { petVetService } from '@services/petVetService';
import type { PetVetLink, Vet, PetVetRole } from '@models/vets';
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
        logger.debug('Loading Pet/Vet Links', data);
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
          <Box sx={{ mb: 2 }}>
            <VetSelector
              label={t('link.add', { ns: 'veterinarians' })}
              onSelect={async (vet: Vet) => {
                if (!userId || !initialValues.id) return;
                const link = await petVetService.linkVetToPet(
                  userId,
                  initialValues.id,
                  vet.id
                );
                logger.debug('Vet linked to pet', { link, vet });
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

                          // Optimistic update
                          // If setting to primary, demote others
                          if (newRole === 'primary') {
                            setLinks((prev) =>
                              prev.map((l) => ({
                                ...l,
                                link: {
                                  ...l.link,
                                  role:
                                    l.link.id === link.id
                                      ? 'primary'
                                      : l.link.role === 'primary'
                                        ? (l.link.previousNonPrimaryRole ??
                                          'other')
                                        : l.link.role,
                                },
                              }))
                            );

                            await petVetService.setPrimaryVet(
                              userId,
                              initialValues.id,
                              link.id
                            );

                            // Telemetry
                            try {
                              const { track } = await import(
                                '@services/analytics/analytics'
                              );
                              track('vet_primary_set');
                            } catch {
                              /* no-op */
                            }
                          } else {
                            // Optimistic update for non-primary role change
                            setLinks((prev) =>
                              prev.map((l) => ({
                                ...l,
                                link: {
                                  ...l.link,
                                  role:
                                    l.link.id === link.id
                                      ? newRole
                                      : l.link.role,
                                },
                              }))
                            );

                            await petVetService.updateLink(userId, link.id, {
                              role: newRole,
                            });
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

export type { Pet } from '@features/pets/types';

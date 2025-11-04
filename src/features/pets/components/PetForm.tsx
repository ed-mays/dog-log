import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import formStyles from '@styles/FormStyles.module.css';
import type { Pet } from '../types.ts';
import { loadNamespace } from '../../../i18n.ts';
import { Button, TextField } from '@mui/material';

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

export type { Pet } from '../types.ts';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import formStyles from '@styles/FormStyles.module.css';
import type { Pet } from '../types.tsx';
import { loadNamespace } from '@i18n';

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
        <label className={formStyles.formLabel} htmlFor="pet-name">
          {t('name', { ns: 'petProperties' })}
        </label>
        <input
          className={formStyles.formInput}
          id="pet-name"
          name="name"
          value={pet.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className={formStyles.formGroup}>
        <label className={formStyles.formLabel} htmlFor="pet-breed">
          {t('breed', { ns: 'petProperties' })}
        </label>
        <input
          className={formStyles.formInput}
          id="pet-breed"
          name="breed"
          value={pet.breed}
          onChange={handleChange}
          required
        />
      </div>
      <div className={formStyles.formActions}>
        <button
          className={formStyles.formButton}
          type="button"
          onClick={onCancel}
        >
          {t('responses.cancel', { ns: 'common' })}
        </button>
        <button
          className={`${formStyles.formButton} ${formStyles.formButtonPrimary}`}
          type="submit"
          disabled={!isValid}
        >
          {t('responses.ok', { ns: 'common' })}
        </button>
      </div>
    </form>
  );
}

export type { Pet } from '../types.tsx';

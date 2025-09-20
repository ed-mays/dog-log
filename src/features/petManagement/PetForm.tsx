import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import formStyles from '@styles/FormStyles.module.css';
import type { Pet } from './types';

interface PetFormProps {
  initialValues: Pet;
  onSubmit: (pet: Pet) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function PetForm({
  initialValues,
  onSubmit,
  onCancel,
  onDirtyChange,
}: PetFormProps) {
  const { t } = useTranslation('petForm');
  const [pet, setPet] = useState(initialValues);

  useEffect(() => {
    const dirty =
      pet.name !== initialValues.name || pet.breed !== initialValues.breed;
    onDirtyChange?.(dirty);
  }, [pet, initialValues, onDirtyChange]);

  const isValid = pet.name.trim().length > 0 && pet.breed.trim().length > 0;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setPet((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) onSubmit(pet);
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
          {t('cancel', { ns: 'common' })}
        </button>
        <button
          className={`${formStyles.formButton} ${formStyles.formButtonPrimary}`}
          type="submit"
          disabled={!isValid}
        >
          {t('ok', { ns: 'common' })}
        </button>
      </div>
    </form>
  );
}

export type { Pet } from './types';

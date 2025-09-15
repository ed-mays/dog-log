import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface Pet {
  id?: string;
  name: string;
  breed: string;
}

interface PetFormProps {
  initialValues: Pet;
  onSubmit: (pet: Pet) => void;
  onCancel: () => void;
  setDirty: (dirty: boolean) => void;
}

export function PetForm({
  initialValues,
  onSubmit,
  onCancel,
  setDirty,
}: PetFormProps) {
  const { t } = useTranslation('petForm'); // Use a relevant namespace for organization
  const [pet, setPet] = useState(initialValues);

  useEffect(() => {
    const dirty =
      pet.name !== initialValues.name || pet.breed !== initialValues.breed;
    setDirty(dirty);
  }, [pet, initialValues, setDirty]);

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
    <form onSubmit={handleSubmit}>
      <label htmlFor="pet-name">{t('name')}</label>
      <input
        id="pet-name"
        name="name"
        value={pet.name}
        onChange={handleChange}
        required
      />
      <label htmlFor="pet-breed">{t('breed')}</label>
      <input
        id="pet-breed"
        name="breed"
        value={pet.breed}
        onChange={handleChange}
        required
      />
      <button type="submit" disabled={!isValid}>
        {t('ok')}
      </button>
      <button type="button" onClick={onCancel}>
        {t('cancel')}
      </button>
    </form>
  );
}

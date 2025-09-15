import React, { useState, useEffect } from 'react';

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
  const [pet, setPet] = useState<Pet>(initialValues);

  useEffect(() => {
    const dirty =
      pet.name !== initialValues.name || pet.breed !== initialValues.breed;
    setDirty(dirty);
  }, [pet, initialValues, setDirty]);

  // Simple validation: fields must not be empty
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
      <div>
        <label htmlFor="pet-name">Name</label>
        <input
          id="pet-name"
          name="name"
          value={pet.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="pet-breed">Breed</label>
        <input
          id="pet-breed"
          name="breed"
          value={pet.breed}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" disabled={!isValid}>
        OK
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

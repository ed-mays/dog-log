import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PetForm } from '@features/petManagement/PetForm';
import type { Pet } from './types';
import { usePetsStore } from '@store/pets.store';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { loadNamespace } from '../../i18n';

const newPetInitialValues: Pet = {
  id: '',
  name: '',
  breed: '',
  birthDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: '',
  isArchived: false,
};

export default function AddPetPage() {
  const addPet = usePetsStore((state) => state.addPet);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const { t } = useTranslation('common');

  // Preload field label namespace used by PetForm without blocking render
  useEffect(() => {
    loadNamespace('petProperties');
  }, []);

  async function handleSubmit(pet: Pet) {
    await addPet({
      name: pet.name,
      breed: pet.breed,
      birthDate: pet.birthDate,
    });
    navigate('/pets');
  }

  function handleCancel() {
    if (formDirty) {
      setShowModal(true);
    } else {
      navigate('/pets');
    }
  }

  function handleModalAccept() {
    setShowModal(false);
    navigate('/pets');
  }

  function handleModalDecline() {
    setShowModal(false);
    // Stay on form
  }

  return (
    <>
      <PetForm
        initialValues={newPetInitialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDirtyChange={setFormDirty}
      />
      {showModal && (
        <ConfirmModal
          text={t('discardChanges')}
          onAccept={handleModalAccept}
          onDecline={handleModalDecline}
          acceptLabel={t('yes')}
          declineLabel={t('no')}
        />
      )}
    </>
  );
}

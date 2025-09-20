import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PetForm } from '@features/petManagement/PetForm';
import type { Pet } from '@features/petManagement/PetForm';
import { usePetsStore } from '@store/pets.store';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal';
import { useTranslation } from 'react-i18next';

export default function AddPetPage() {
  const addPet = usePetsStore((state) => state.addPet);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const { t } = useTranslation('common');

  function handleSubmit(pet: Pet) {
    const id = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    addPet({ ...pet, id });
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
        initialValues={{ name: '', breed: '' }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDirtyChange={setFormDirty}
      />
      {showModal && (
        <ConfirmModal
          text={t('discardChangesQuestion')}
          onAccept={handleModalAccept}
          onDecline={handleModalDecline}
          acceptLabel={t('yes')}
          declineLabel={t('no')}
        />
      )}
    </>
  );
}

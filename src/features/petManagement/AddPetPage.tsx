import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PetForm } from '@features/petManagement/PetForm';
import type { Pet } from '@features/petManagement/PetForm';
import { usePetsStore } from '@store/pets.store';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal';

export default function AddPetPage() {
  const addPet = usePetsStore((state) => state.addPet);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  function handleSubmit(pet: Pet) {
    addPet({ ...pet, id: '3' }); // generateId is your id function
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
        setDirty={setFormDirty}
      />
      {showModal && (
        <ConfirmModal
          text="Discard changes?"
          onAccept={handleModalAccept}
          onDecline={handleModalDecline}
        />
      )}
    </>
  );
}

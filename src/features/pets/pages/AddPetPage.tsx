import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@mui/material';
import { PetForm } from '@features/pets/components/PetForm';
import type { Pet } from '@features/pets/types';
import { usePetsStore } from '@store/pets.store';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { loadNamespace } from '@i18n';

const newPetInitialValues: Pet = {
  id: '',
  name: '',
  breed: '',
  birthDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: '',
  photos: [],
  isArchived: false,
};

export default function AddPetPage() {
  const [nsReady, setNsReady] = useState(false);

  const addPet = usePetsStore((state) => state.addPet);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // petProperties
  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('petProperties')]).then(() => {
      if (mounted) setNsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const { t } = useTranslation();
  if (!nsReady) return null;

  async function handleSubmit(pet: Pet) {
    setSubmitError(null);
    try {
      await addPet({
        name: pet.name,
        breed: pet.breed,
        birthDate: pet.birthDate,
      });
      navigate('/pets');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t('errors.savePetFailed', {
              defaultValue: 'Failed to save pet. Please try again.',
            });
      setSubmitError(message);
    }
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
      {submitError && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
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
          acceptLabel={t('responses.yes')}
          declineLabel={t('responses.no')}
        />
      )}
    </>
  );
}

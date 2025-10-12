import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadNamespace } from '@i18n';
import { usePetsStore } from '@store/pets.store.tsx';
import type { Pet } from '@features/pets/types';
import { PetForm } from '@features/pets/components/PetForm.tsx';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal.tsx';

export default function EditPetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('petList');

  const pets = usePetsStore((s) => s.pets);
  const updatePet = usePetsStore((s) => s.updatePet);

  const [nsReady, setNsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadNamespace('petList'),
      loadNamespace('petProperties'),
      loadNamespace('common'),
    ]).then(() => {
      if (mounted) setNsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const pet: Pet | undefined = useMemo(
    () => pets.find((p) => p.id === id),
    [pets, id]
  );

  if (!nsReady) return null;

  if (!pet) {
    return (
      <div role="alert">
        {t('notFound', { ns: 'petList', defaultValue: 'Pet not found' })}
      </div>
    );
  }

  async function handleSubmit(values: Pet) {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updatePet(id, { name: values.name, breed: values.breed });
      navigate('/pets');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setError(t('errors.updateFailed', { ns: 'common' }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>{t('editPetTitle', { ns: 'petList', defaultValue: 'Edit Pet' })}</h1>
      {error && (
        <div role="alert" data-testid="edit-pet-error">
          {error}
        </div>
      )}
      {saving && (
        <div role="alert" data-testid="edit-pet-saving">
          Saving...
        </div>
      )}
      <PetForm
        initialValues={pet}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (formDirty) setShowModal(true);
          else navigate('/pets');
        }}
        onDirtyChange={setFormDirty}
      />
      {showModal && (
        <ConfirmModal
          text={t('discardChanges', { ns: 'common' })}
          onAccept={() => {
            setShowModal(false);
            navigate('/pets');
          }}
          onDecline={() => setShowModal(false)}
          acceptLabel={t('yes', { ns: 'common' })}
          declineLabel={t('no', { ns: 'common' })}
        />
      )}
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import styles from './PetList.module.css';
import type { Pet } from '../types.tsx';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.tsx';
import { Link } from 'react-router-dom';
import { PetListRow } from '@features/petManagement/components/PetListRow.tsx';
import { loadNamespace } from '@i18n';
import { useEffect, useState } from 'react';
import { PetForm } from '@features/petManagement/components/PetForm.tsx';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal.tsx';
import { usePetsStore } from '@store/pets.store.tsx';

type PetListProps = {
  pets: Pet[];
  dataTestId?: string;
};

export function PetList({ dataTestId = 'pet-list' }: PetListProps) {
  const [nsReady, setNsReady] = useState(false);
  const pets = usePetsStore((s) => s.pets);
  const updatePetInStore = usePetsStore((s) => s.updatePet);
  const deletePetInStore = usePetsStore((s) => s.deletePet);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const { t } = useTranslation('petList');

  const addPetEnabled = useFeatureFlag('addPetEnabled');
  const petActionsEnabled = useFeatureFlag('petActionsEnabled');
  if (!nsReady) return null;

  async function submitEdit(values: { name: string; breed: string }) {
    if (!editingPet) return;
    setSaving(true);
    setError(null);
    try {
      await updatePetInStore(editingPet.id, values);
      setEditingPet(null);
    } catch (e) {
      setError(t('errors.updateFailed', { ns: 'common' }));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingPet) return;
    setSaving(true);
    setError(null);
    try {
      await deletePetInStore(deletingPet.id);
      setDeletingPet(null);
    } catch (e) {
      setError(t('errors.deleteFailed', { ns: 'common' }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {addPetEnabled && (
        <div className={styles.headerRow}>
          <Link
            to="/pets/new"
            className={styles.addButton}
            role="button"
            data-testid={'add-pet-button'}
            aria-label={t('addPet')}
            title={t('addPet')}
          >
            {'\u2795'}
          </Link>
        </div>
      )}

      {error && (
        <div role="alert" data-testid="pet-list-error">
          {error}
        </div>
      )}

      {saving && (
        <div role="alert" data-testid="pet-list-error">
          Saving...
        </div>
      )}
      <table className={styles.tableFullWidth} data-testid={dataTestId}>
        <thead>
          <tr>
            <th scope="col" className={styles.th}>
              {t('name', { ns: 'petProperties' })}
            </th>
            <th scope="col" className={styles.th}>
              {t('breed', { ns: 'petProperties' })}
            </th>
            {petActionsEnabled && (
              <th scope="col" className={styles.th}>
                {t('actions', { ns: 'common' })}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {pets.map((pet) => (
            <PetListRow
              key={pet.id}
              pet={pet}
              onEdit={setEditingPet}
              onDelete={setDeletingPet}
            />
          ))}
        </tbody>
      </table>

      {editingPet && (
        <div role="dialog" aria-modal="true">
          <div>
            <h2>{t('editPetTitle', { ns: 'petList' })}</h2>
            <PetForm
              initialValues={editingPet}
              onSubmit={(p) => submitEdit({ name: p.name, breed: p.breed })}
              onCancel={() => setEditingPet(null)}
            />
          </div>
        </div>
      )}

      {deletingPet && (
        <ConfirmModal
          text={t('confirmDeleteMessage', {
            ns: 'common',
            petName: deletingPet.name,
          })}
          onAccept={confirmDelete}
          onDecline={() => setDeletingPet(null)}
        />
      )}
    </>
  );
}

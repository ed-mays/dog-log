import { useTranslation } from 'react-i18next';
import styles from './PetList.module.css';
import type { Pet } from '../types.ts';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.ts';
import { Link, useNavigate } from 'react-router-dom';
import { PetListRow } from '@features/pets/components/PetListRow.tsx';
import { loadNamespace } from '../../../i18n.ts';
import { useEffect, useState } from 'react';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal.tsx';
import { usePetsStore } from '@store/pets.store.ts';
import { IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

type PetListProps = {
  pets: Pet[];
  dataTestId?: string;
};

export function PetList({ dataTestId = 'pet-list' }: PetListProps) {
  const [nsReady, setNsReady] = useState(false);
  const pets = usePetsStore((s) => s.pets);
  const deletePetInStore = usePetsStore((s) => s.deletePet);
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

  const { t } = useTranslation();

  const addPetEnabled = useFeatureFlag('addPetEnabled');
  const petActionsEnabled = useFeatureFlag('petActionsEnabled');
  const navigate = useNavigate();
  if (!nsReady) return null;

  async function confirmDelete() {
    if (!deletingPet) return;
    setSaving(true);
    setError(null);
    try {
      await deletePetInStore(deletingPet.id);
      setDeletingPet(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setError(t('errors.deleteFailed', { ns: 'common' }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid={dataTestId}>
      {addPetEnabled && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <Tooltip title={t('addPet', { ns: 'petList' })}>
              <IconButton
                component={Link}
                to="/pets/new"
                color="primary"
                size="large"
                data-testid="add-pet-button"
                aria-label={t('addPet', { ns: 'petList' })}
                sx={{ ml: 1 }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </div>
        </>
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

      {pets.length === 0 ? (
        <div
          data-testid="no-pets-indicator"
          style={{ marginTop: '1rem', textAlign: 'center' }}
        >
          <p>{t('noPetsLabel', { ns: 'petList' })}</p>
          {addPetEnabled && (
            <Link to="/pets/new">{t('addFirstPetCta', { ns: 'petList' })}</Link>
          )}
        </div>
      ) : (
        <table className={styles.tableFullWidth}>
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
                onDelete={setDeletingPet}
                onEdit={(p) => navigate(`/pets/${p.id}/edit`)}
              />
            ))}
          </tbody>
        </table>
      )}

      {deletingPet && (
        <ConfirmModal
          text={t('confirmDeleteMessage', {
            ns: 'common',
            petName: deletingPet.name,
          })}
          onAccept={confirmDelete}
          onDecline={() => setDeletingPet(null)}
          error={error}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import styles from './PetList.module.css';
import type { Pet } from '../types';
import { loadNamespace } from '@i18n';
import { useTranslation } from 'react-i18next';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.tsx';
import { useNavigate } from 'react-router-dom';

type PetListRowProps = {
  pet: Pet;
  onDelete?: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
};

export function PetListRow({ pet, onDelete, onEdit }: PetListRowProps) {
  const [nsReady, setNsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('common')]).then(() => {
      if (mounted) setNsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const petActionsEnabled = useFeatureFlag('petActionsEnabled');
  const { t } = useTranslation('petList');

  if (!nsReady) return null;

  const editClick = () =>
    onEdit ? onEdit(pet) : navigate(`/pets/${pet.id}/edit`);

  const deleteClick = () => onDelete?.(pet);

  return (
    <tr key={pet.id}>
      <td className={styles.td}>{pet.name}</td>
      <td className={styles.td}>{pet.breed}</td>
      {petActionsEnabled && (
        <td className={styles.td}>
          <button className={styles.addButton} onClick={editClick}>
            {t('edit', { ns: 'common' })}
          </button>
          <button className={styles.addButton} onClick={deleteClick}>
            {t('delete', { ns: 'common' })}
          </button>
        </td>
      )}
    </tr>
  );
}

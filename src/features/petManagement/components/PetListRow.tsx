import React, { useEffect, useState } from 'react';
import styles from './PetList.module.css';
import type { Pet } from '../types';
import { loadNamespace } from '@i18n';
import { useTranslation } from 'react-i18next';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.tsx';

type PetListRowProps = {
  pet: Pet;
};

export function PetListRow({ pet }: PetListRowProps) {
  const [nsReady, setNsReady] = useState(false);

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

  const petActionsEnabled = useFeatureFlag('petActionsEnabled');
  const { t } = useTranslation('petList');

  if (!nsReady) return null;

  const editClick = async () => {
    alert('Editing ' + pet.id);
  };

  const deleteClick = async () => {
    alert('Deleting ' + pet.id);
  };

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

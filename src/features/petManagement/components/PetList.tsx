import { useTranslation } from 'react-i18next';
import styles from './PetList.module.css';
import type { Pet } from '../types.tsx';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.tsx';
import { Link } from 'react-router-dom';
import { PetListRow } from '@features/petManagement/components/PetListRow.tsx';
import { loadNamespace } from '@i18n';
import { useEffect, useState } from 'react';

type PetListProps = {
  pets: Pet[];
  dataTestId?: string;
};

export function PetList({ pets, dataTestId = 'pet-list' }: PetListProps) {
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

  const { t } = useTranslation('petList');

  const addPetEnabled = useFeatureFlag('addPetEnabled');
  const petActionsEnabled = useFeatureFlag('petActionsEnabled');
  if (!nsReady) return null;

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
            <PetListRow key={pet.id} pet={pet} />
          ))}
        </tbody>
      </table>
    </>
  );
}

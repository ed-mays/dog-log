import { useTranslation } from 'react-i18next';
import styles from './PetList.module.css';
import type { Pet } from './types';
import { useFeatureFlag } from '@featureFlags/useFeatureFlag';
import { Link } from 'react-router-dom';

type PetListProps = {
  pets: Pet[];
  dataTestId?: string;
};

export function PetList({ pets, dataTestId = 'pet-list' }: PetListProps) {
  const { t } = useTranslation('petList');
  const addPetEnabled = useFeatureFlag('addPetEnabled');

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
          </tr>
        </thead>
        <tbody>
          {pets.map((pet) => (
            <tr key={pet.id}>
              <td className={styles.td}>{pet.name}</td>
              <td className={styles.td}>{pet.breed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

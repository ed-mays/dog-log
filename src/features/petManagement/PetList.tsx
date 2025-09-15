import { useTranslation } from 'react-i18next';
import styles from './PetList.module.css';
import type { Pet } from './petListTypes.tsx';
import { useFeatureFlag } from '@featureFlags/useFeatureFlag.tsx';
import { Link } from 'react-router-dom';

type PetListProps = {
  pets: Pet[];
  'data-TestId'?: string;
};

export function PetList({
  pets,
  'data-TestId': dataTestId = 'pet-list',
}: PetListProps) {
  const { t } = useTranslation(['petList', 'petProperties']);
  const enable_add_pets = useFeatureFlag('add_pet_enabled');

  return (
    <>
      {enable_add_pets && (
        <div className={styles.headerRow}>
          <Link to="/pets/new">
            <button
              className={styles.addButton}
              data-testid={'add-pet-button'}
              aria-label={t('addPet')}
              title={t('addPet')}
            >
              {'\u2795'}
            </button>
          </Link>
        </div>
      )}

      <table className={styles.tableFullWidth} data-testid={dataTestId}>
        <thead>
          <tr>
            <th className={styles.th}>{t('name', { ns: 'petProperties' })}</th>
            <th className={styles.th}>{t('breed', { ns: 'petProperties' })}</th>
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

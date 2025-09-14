import { useTranslation } from 'react-i18next';
import styles from './PetList.module.css';
import type { Pet } from './petListTypes.tsx';
import { useFeatureFlag } from '@featureFlags/useFeatureFlag.tsx';

type PetListProps = {
  pets: Pet[];
  'data-TestId'?: string;
};

export function PetList({
  pets,
  'data-TestId': dataTestId = 'pet-list',
}: PetListProps) {
  const { t } = useTranslation('petList');
  const enable_add_pets = useFeatureFlag('add_pet_enabled');

  return (
    <>
      {enable_add_pets && (
        <div className={styles.headerRow}>
          <button className={styles.addButton} data-testid={'add-pet-button'}>
            Add
          </button>
        </div>
      )}

      <table className={styles.tableFullWidth} data-testid={dataTestId}>
        <thead>
          <tr>
            <th className={styles.th}>{t('columnHeaders.name')}</th>
            <th className={styles.th}>{t('columnHeaders.breed')}</th>
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

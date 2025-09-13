import { useTranslation } from 'react-i18next';
import styles from './PetList.module.css';
import type { Pet } from './petListTypes.tsx';

type PetListProps = {
  pets: Pet[];
  'data-TestId'?: string;
};

export function PetList({
  pets,
  'data-TestId': dataTestId = 'pet-list',
}: PetListProps) {
  const { t } = useTranslation('petList');

  return (
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
  );
}

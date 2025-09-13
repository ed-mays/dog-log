import { useTranslation } from 'react-i18next';
import styles from './DogList.module.css';

export interface Dog {
  id: string;
  name: string;
  breed: string;
}
type DogListProps = {
  dogs: Dog[];
  'data-TestId'?: string;
};

export function DogList({
  dogs,
  'data-TestId': dataTestId = 'dog-list',
}: DogListProps) {
  const { t } = useTranslation('dogList');

  return (
    <table className={styles.tableFullWidth} data-testid={dataTestId}>
      <thead>
        <tr>
          <th>{t('columnHeaders.name')}</th>
          <th>{t('columnHeaders.breed')}</th>
        </tr>
      </thead>
      <tbody>
        {dogs.map((dog) => (
          <tr key={dog.id}>
            <td>{dog.name}</td>
            <td>{dog.breed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

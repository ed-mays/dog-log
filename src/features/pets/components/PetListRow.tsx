import { useEffect, useState } from 'react';
import styles from './PetList.module.css';
import type { Pet } from '../types.ts';
import { loadNamespace } from '../../../i18n.ts';
import { useTranslation } from 'react-i18next';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag.ts';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { TableRow, TableCell, Button, Link } from '@mui/material';

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
    <TableRow key={pet.id}>
      <TableCell className={styles.td}>
        <Link component={RouterLink} to={`/pets/${pet.id}`} underline="hover">
          {pet.name}
        </Link>
      </TableCell>
      <TableCell className={styles.td}>{pet.breed}</TableCell>
      {petActionsEnabled && (
        <TableCell className={styles.td}>
          <Button variant="outlined" color="primary" onClick={editClick}>
            {t('edit', { ns: 'common' })}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={deleteClick}
            sx={{ ml: 1 }}
          >
            {t('delete', { ns: 'common' })}
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

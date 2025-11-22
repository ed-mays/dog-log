import { useState } from 'react';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@components/common/ConfirmModal/ConfirmModal';
import type { Pet } from '@features/pets/types';

interface PetActionsProps {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  deleteError?: string | null;
  isDeleting?: boolean; // External loading state for delete
}

export function PetActions({
  pet,
  onEdit,
  onDelete,
  deleteError,
  isDeleting,
}: PetActionsProps) {
  const { t } = useTranslation('common');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAccept = async () => {
    await onDelete();
    setShowConfirm(false);
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <Button
        variant="outlined"
        color="primary"
        onClick={onEdit}
        startIcon={<EditIcon fontSize="small" />}
        disabled={isDeleting}
      >
        {t('edit')}
      </Button>
      <Button
        variant="outlined"
        color="error"
        onClick={() => setShowConfirm(true)}
        sx={{ ml: 1 }}
        startIcon={<DeleteIcon fontSize="small" />}
        disabled={isDeleting}
      >
        {t('delete')}
      </Button>

      {showConfirm && (
        <ConfirmModal
          text={t('confirmDeleteMessage', {
            petName: pet.name,
          })}
          onAccept={handleAccept}
          onDecline={() => setShowConfirm(false)}
          error={deleteError}
        />
      )}
    </div>
  );
}

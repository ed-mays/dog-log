import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Button,
  Alert,
} from '@mui/material';

interface ConfirmModalProps {
  text: string;
  onAccept: () => void;
  onDecline: () => void;
  acceptLabel?: string;
  declineLabel?: string;
  error?: string | null;
}

export function ConfirmModal({
  text,
  onAccept,
  onDecline,
  acceptLabel,
  declineLabel,
  error,
}: ConfirmModalProps) {
  const { t } = useTranslation('common');
  const headingId = React.useId();

  const yesLabel = acceptLabel ?? t('responses.yes', 'Yes');
  const noLabel = declineLabel ?? t('responses.no', 'No');

  return (
    <Dialog
      open
      onClose={(_, reason) => {
        // Only close automatically on ESC to match explicit test expectations
        if (reason === 'escapeKeyDown') onDecline();
      }}
      aria-labelledby={headingId}
      keepMounted
      // Note: BackdropProps is deprecated in MUI and slotProps typing is restrictive.
      // Narrow cast to never to attach a test id to the backdrop without using `any`.
      // This is safe because it's a non-functional testing attribute.
      slotProps={{ backdrop: { 'data-testid': 'dialog-backdrop' } as never }}
    >
      <DialogTitle id={headingId}>{text}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" role="alert" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onDecline} autoFocus>
          {noLabel}
        </Button>
        <Button onClick={onAccept} variant="contained" color="primary">
          {yesLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

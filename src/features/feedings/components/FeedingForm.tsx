import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, TextField, Stack, Alert } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { FeedingCreateInput } from '@features/feedings/types';

interface FeedingFormProps {
  onSubmit: (data: FeedingCreateInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function FeedingForm({
  onSubmit,
  isSubmitting = false,
}: FeedingFormProps) {
  const { t } = useTranslation('feedings');
  const [date, setDate] = useState<Date | null>(new Date());
  const [foodType, setFoodType] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError(t('dateRequired', { defaultValue: 'Date is required' }));
      return;
    }
    if (!foodType.trim()) {
      setError(
        t('foodTypeRequired', { defaultValue: 'Food type is required' })
      );
      return;
    }

    try {
      setError(null);
      await onSubmit({
        date,
        foodType: foodType.trim(),
        notes: notes.trim() || undefined,
      });
      // Reset form
      setDate(new Date());
      setFoodType('');
      setNotes('');
    } catch (err) {
      console.error(err);
      setError(t('submitError', { defaultValue: 'Failed to save feeding' }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <DateTimePicker
            label={t('dateTime', { defaultValue: 'Date & Time' })}
            value={date}
            onChange={(newValue) => setDate(newValue)}
            slotProps={{ textField: { required: true, fullWidth: true } }}
          />

          <TextField
            label={t('foodType', { defaultValue: 'Food Type' })}
            value={foodType}
            onChange={(e) => setFoodType(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label={t('notes', { defaultValue: 'Notes' })}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting
              ? t('saving', { defaultValue: 'Saving...' })
              : t('addFeeding', { defaultValue: 'Add Feeding' })}
          </Button>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type {
  PetMedication,
  DoseLogCreateInput,
  DoseUnit,
  DoseStatus,
  DoseLog,
} from '@features/medications/types';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useAuthStore } from '@store/auth.store';

interface DoseLogFormProps {
  petMedication: PetMedication;
  onSubmit: (input: DoseLogCreateInput) => Promise<void>;
  onCancel: () => void;
  initialData?: DoseLog;
}

export const DoseLogForm = ({
  petMedication,
  onSubmit,
  onCancel,
  initialData,
}: DoseLogFormProps) => {
  const { t } = useTranslation();
  const isEnabled = useFeatureFlag('medicationsEnabled');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isEnabled) {
    return null;
  }

  // Form State
  const [timestampGiven, setTimestampGiven] = useState<string>(
    new Date().toISOString().slice(0, 16) // Format for datetime-local: YYYY-MM-DDTHH:mm
  );
  const [amountGiven, setAmountGiven] = useState<number>(
    petMedication.doseAmount
  );
  const [doseUnit, setDoseUnit] = useState<DoseUnit>(petMedication.doseUnit);
  const [status, setStatus] = useState<DoseStatus>('given');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setTimestampGiven(initialData.timestampGiven.slice(0, 16));
      setAmountGiven(initialData.amountGiven);
      setDoseUnit(initialData.doseUnit);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const input: DoseLogCreateInput = {
        petId: petMedication.petId,
        petMedicationId: petMedication.id,
        timestampGiven: new Date(timestampGiven).toISOString(),
        amountGiven,
        doseUnit,
        status,
        notes: notes || null,
        createdBy: useAuthStore.getState().user?.uid || '',
      };

      await onSubmit(input);
    } catch (error) {
      console.error('Failed to submit dose log', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {initialData
          ? t('medications.editDoseLog', 'Edit Dose Log')
          : t('medications.logDose', 'Log Dose')}
      </Typography>

      <Box component="form" role="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label={t('medications.fields.timestampGiven', 'Time Given')}
              type="datetime-local"
              fullWidth
              required
              value={timestampGiven}
              onChange={(e) => setTimestampGiven(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              label={t('medications.fields.amountGiven', 'Amount')}
              type="number"
              fullWidth
              required
              value={amountGiven}
              onChange={(e) => setAmountGiven(Number(e.target.value))}
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>
                {t('medications.fields.doseUnit', 'Unit')}
              </InputLabel>
              <Select
                value={doseUnit}
                label={t('medications.fields.doseUnit', 'Unit')}
                onChange={(e) => setDoseUnit(e.target.value as DoseUnit)}
              >
                <MenuItem value="tablet">Tablet</MenuItem>
                <MenuItem value="mL">mL</MenuItem>
                <MenuItem value="drop">Drop</MenuItem>
                <MenuItem value="capsule">Capsule</MenuItem>
                <MenuItem value="scoop">Scoop</MenuItem>
                <MenuItem value="spray">Spray</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth required>
              <InputLabel>
                {t('medications.fields.status', 'Status')}
              </InputLabel>
              <Select
                value={status}
                label={t('medications.fields.status', 'Status')}
                onChange={(e) => setStatus(e.target.value as DoseStatus)}
              >
                <MenuItem value="given">Given</MenuItem>
                <MenuItem value="skipped">Skipped</MenuItem>
                <MenuItem value="missed">Missed</MenuItem>
                <MenuItem value="vomited">Vomited</MenuItem>
                <MenuItem value="otherIssue">Other Issue</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label={t('medications.fields.notes', 'Notes')}
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>

        <Box
          sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}
        >
          <Button onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {t('common.save', 'Save')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

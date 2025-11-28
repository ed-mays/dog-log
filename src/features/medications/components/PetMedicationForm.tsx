import { useState } from 'react';
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
import { usePetMedicationStore } from '@store/usePetMedicationStore';
import { MedicationCatalogDialog } from './MedicationCatalogDialog';
import type {
  MedicationDefinition,
  PetMedicationCreateInput,
  DoseUnit,
  ScheduleType,
  MedicationForm,
  MedicationRoute,
} from '@features/medications/types';

interface PetMedicationFormProps {
  petId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const PetMedicationForm = ({
  petId,
  onCancel,
  onSuccess,
}: PetMedicationFormProps) => {
  const { t } = useTranslation();
  const { addPetMedication, isLoading } = usePetMedicationStore();
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationDefinition | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Form State
  const [doseAmount, setDoseAmount] = useState<number>(1);
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('tablet');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('onceDaily');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [customLabel, setCustomLabel] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedication) return;

    try {
      const input: PetMedicationCreateInput = {
        petId,
        medicationDefinitionId: selectedMedication.id,
        customLabel: customLabel || undefined,
        form: selectedMedication.defaultForm as MedicationForm,
        route: selectedMedication.defaultRoute as MedicationRoute,
        doseAmount,
        doseUnit,
        scheduleType,
        scheduleConfig: {
          startDate,
        },
        active: true,
        createdBy: 'user', // Should come from auth context
      };

      await addPetMedication(petId, input);
      onSuccess();
    } catch (error) {
      console.error('Failed to add pet medication', error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('medications.addTitle', 'Add Medication')}
      </Typography>

      <Box component="form" role="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Button
              variant="outlined"
              onClick={() => setIsCatalogOpen(true)}
              fullWidth
            >
              {selectedMedication
                ? selectedMedication.name
                : t('medications.selectMedication', 'Select Medication')}
            </Button>
          </Grid>

          {selectedMedication && (
            <>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t(
                    'medications.fields.customLabel',
                    'Custom Label (Optional)'
                  )}
                  fullWidth
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  helperText={t(
                    'medications.fields.customLabelHelper',
                    'e.g. "Morning Meds"'
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  label={t('medications.fields.doseAmount', 'Dose Amount')}
                  type="number"
                  fullWidth
                  required
                  value={doseAmount}
                  onChange={(e) => setDoseAmount(Number(e.target.value))}
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
                    {t('medications.fields.scheduleType', 'Schedule')}
                  </InputLabel>
                  <Select
                    value={scheduleType}
                    label={t('medications.fields.scheduleType', 'Schedule')}
                    onChange={(e) =>
                      setScheduleType(e.target.value as ScheduleType)
                    }
                  >
                    <MenuItem value="onceDaily">Once Daily</MenuItem>
                    <MenuItem value="twiceDaily">Twice Daily</MenuItem>
                    <MenuItem value="everyXHours">Every X Hours</MenuItem>
                    <MenuItem value="everyXDays">Every X Days</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('medications.fields.startDate', 'Start Date')}
                  type="date"
                  fullWidth
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
        </Grid>

        <Box
          sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}
        >
          <Button onClick={onCancel} disabled={isLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!selectedMedication || isLoading}
          >
            {t('common.save', 'Save')}
          </Button>
        </Box>
      </Box>

      <MedicationCatalogDialog
        open={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelect={(med) => {
          setSelectedMedication(med);
          setIsCatalogOpen(false);
        }}
      />
    </Paper>
  );
};

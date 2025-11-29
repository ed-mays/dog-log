import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MedicationLiquidIcon from '@mui/icons-material/MedicationLiquid';
import { useTranslation } from 'react-i18next';
import { usePetMedicationStore } from '@store/usePetMedicationStore';
import { useMedicationStore } from '@store/useMedicationStore';
import { useDoseLogStore } from '@store/useDoseLogStore';
import { PetMedicationForm } from '../components/PetMedicationForm';
import { DoseLogForm } from '../components/DoseLogForm';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import type { PetMedication, DoseLogCreateInput } from '../types';

interface PetMedicationsPageProps {
  petId?: string;
}

export const PetMedicationsPage = ({
  petId: propPetId,
}: PetMedicationsPageProps = {}) => {
  const params = useParams<{ petId: string }>();
  const petId = propPetId || params.petId;
  const { t } = useTranslation();
  const {
    petMedications,
    fetchPetMedications,
    deactivatePetMedication,
    isLoading,
    error,
  } = usePetMedicationStore();
  const { medications, fetchMedications: fetchDefinitions } =
    useMedicationStore();
  const { addDoseLog } = useDoseLogStore();
  const medicationsEnabled = useFeatureFlag('medicationsEnabled');

  const [isAdding, setIsAdding] = useState(false);
  const [selectedMedication, setSelectedMedication] =
    useState<PetMedication | null>(null);

  useEffect(() => {
    if (petId) {
      fetchPetMedications(petId);
      fetchDefinitions(); // Ensure we have definitions to resolve names
    }
  }, [petId, fetchPetMedications, fetchDefinitions]);

  const medicationsList = petId ? petMedications[petId] || [] : [];

  const getMedicationName = (defId: string) => {
    const def = medications.find((m) => m.id === defId);
    return def ? def.name : 'Unknown Medication';
  };

  const handleDeactivate = async (medId: string) => {
    if (
      petId &&
      window.confirm(t('medications.confirmDeactivate', 'Are you sure?'))
    ) {
      await deactivatePetMedication(petId, medId);
    }
  };

  const handleLogDose = (med: PetMedication) => {
    setSelectedMedication(med);
  };

  const handleDoseSubmit = async (input: DoseLogCreateInput) => {
    if (petId) {
      await addDoseLog(petId, input);
      setSelectedMedication(null);
    }
  };

  if (!petId) return null;

  if (isAdding) {
    return (
      <PetMedicationForm
        petId={petId}
        onCancel={() => setIsAdding(false)}
        onSuccess={() => setIsAdding(false)}
      />
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5">
          {t('medications.title', 'Medications')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAdding(true)}
        >
          {t('medications.add', 'Add Medication')}
        </Button>
      </Box>

      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!isLoading && medicationsList.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('medications.noMedications', 'No active medications found.')}
          </Typography>
        </Paper>
      )}

      <List>
        {medicationsList.map((med) => (
          <Paper key={med.id} sx={{ mb: 2 }}>
            <ListItem
              secondaryAction={
                <Box>
                  {medicationsEnabled && (
                    <IconButton
                      edge="end"
                      aria-label="log dose"
                      onClick={() => handleLogDose(med)}
                      sx={{ mr: 1 }}
                    >
                      <MedicationLiquidIcon />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeactivate(med.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  med.customLabel ||
                  getMedicationName(med.medicationDefinitionId)
                }
                secondary={`${med.doseAmount} ${med.doseUnit} - ${med.scheduleType}`}
              />
            </ListItem>
          </Paper>
        ))}
      </List>

      {selectedMedication && (
        <Dialog
          open={!!selectedMedication}
          onClose={() => setSelectedMedication(null)}
          fullWidth
          maxWidth="sm"
        >
          <DialogContent>
            <DoseLogForm
              petMedication={selectedMedication}
              onSubmit={handleDoseSubmit}
              onCancel={() => setSelectedMedication(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

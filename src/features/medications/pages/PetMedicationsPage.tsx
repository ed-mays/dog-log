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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { usePetMedicationStore } from '@store/usePetMedicationStore';
import { useMedicationStore } from '@store/useMedicationStore';
import { PetMedicationForm } from '../components/PetMedicationForm';

export const PetMedicationsPage = () => {
  const { petId } = useParams<{ petId: string }>();
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

  const [isAdding, setIsAdding] = useState(false);

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
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeactivate(med.id)}
                >
                  <DeleteIcon />
                </IconButton>
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
    </Box>
  );
};

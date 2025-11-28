import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useMedicationStore } from '@store/useMedicationStore';
import type {
  MedicationDefinition,
  MedicationForm,
  MedicationRoute,
} from '@features/medications/types';
import { useTranslation } from 'react-i18next';

interface MedicationCatalogDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (medication: MedicationDefinition) => void;
}

export const MedicationCatalogDialog = ({
  open,
  onClose,
  onSelect,
}: MedicationCatalogDialogProps) => {
  const { t } = useTranslation();
  const { medications, fetchMedications, addMedication, isLoading } =
    useMedicationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedForm, setNewMedForm] = useState('pill');
  const [newMedRoute, setNewMedRoute] = useState('oral');

  useEffect(() => {
    if (open) {
      fetchMedications();
    }
  }, [open, fetchMedications]);

  const filteredMedications = medications.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newMedName.trim()) return;

    try {
      await addMedication({
        name: newMedName,
        defaultForm: newMedForm as MedicationForm,
        defaultRoute: newMedRoute as MedicationRoute,
        isArchived: false,
        createdBy: 'user', // In a real app, get from auth context
      });
      setIsCreating(false);
      setNewMedName('');
      // Optionally auto-select the new medication here
    } catch (error) {
      console.error('Failed to create medication', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isCreating
          ? t('medications.catalog.createTitle', 'Create New Medication')
          : t('medications.catalog.title', 'Select Medication')}
      </DialogTitle>
      <DialogContent>
        {!isCreating ? (
          <>
            <TextField
              autoFocus
              margin="dense"
              label={t('common.search', 'Search')}
              fullWidth
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <List sx={{ maxHeight: 300, overflow: 'auto', mt: 2 }}>
              {filteredMedications.map((med) => (
                <ListItem key={med.id} disablePadding>
                  <ListItemButton onClick={() => onSelect(med)}>
                    <ListItemText
                      primary={med.name}
                      secondary={`${med.defaultForm} - ${med.defaultRoute}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {filteredMedications.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 2 }}
                >
                  {t('medications.catalog.noResults', 'No medications found')}
                </Typography>
              )}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button onClick={() => setIsCreating(true)}>
                {t('medications.catalog.createNew', 'Create New Medication')}
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('medications.fields.name', 'Name')}
              fullWidth
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>{t('medications.fields.form', 'Form')}</InputLabel>
              <Select
                value={newMedForm}
                label={t('medications.fields.form', 'Form')}
                onChange={(e) => setNewMedForm(e.target.value)}
              >
                <MenuItem value="pill">Pill</MenuItem>
                <MenuItem value="liquid">Liquid</MenuItem>
                <MenuItem value="chew">Chew</MenuItem>
                <MenuItem value="injection">Injection</MenuItem>
                <MenuItem value="topical">Topical</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('medications.fields.route', 'Route')}</InputLabel>
              <Select
                value={newMedRoute}
                label={t('medications.fields.route', 'Route')}
                onChange={(e) => setNewMedRoute(e.target.value)}
              >
                <MenuItem value="oral">Oral</MenuItem>
                <MenuItem value="topical">Topical</MenuItem>
                <MenuItem value="subcutaneous">Subcutaneous</MenuItem>
                <MenuItem value="intramuscular">Intramuscular</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={isCreating ? () => setIsCreating(false) : onClose}>
          {t('common.cancel', 'Cancel')}
        </Button>
        {isCreating && (
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={isLoading}
          >
            {t('common.create', 'Create')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

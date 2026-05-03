import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePetsStore } from '@store/pets.store';
import { useIncidentStore } from '@store/useIncidentStore';

// BR-28 (multi-pet rule), BR-1 (≤2 taps), NFR-3 (one-thumb); DQ-7 (bottom Drawer).
// Tapping a pet IS the activation: calls startIncident synchronously then navigates.

interface ActivationPetPickerProps {
  open: boolean;
  onClose: () => void;
}

export function ActivationPetPicker({
  open,
  onClose,
}: ActivationPetPickerProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const pets = usePetsStore((s) => s.pets);
  const { startIncident } = useIncidentStore();

  const handleSelect = (petId: string) => {
    onClose();
    void startIncident({ petId });
    navigate('/incidents/active');
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ p: 2, pb: 0 }}>
        <Typography variant="h6">{t('incidents.petPickerTitle')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('incidents.petPickerHelp')}
        </Typography>
      </Box>
      <List>
        {pets.map((pet) => (
          <ListItem disablePadding key={pet.id}>
            <ListItemButton
              onClick={() => handleSelect(pet.id)}
              sx={{ minHeight: 44 }}
            >
              <ListItemAvatar>
                <Avatar src={pet.mainPhotoUrl || undefined} alt={pet.name}>
                  {pet.name[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={pet.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

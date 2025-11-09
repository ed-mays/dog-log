import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function AddVetPage() {
  const { t } = useTranslation('veterinarians');
  return (
    <Box sx={{ p: 2 }} aria-label="add veterinarian page">
      <Typography variant="h4" component="h2">
        {t('actions.add', 'Add veterinarian')}
      </Typography>
    </Box>
  );
}

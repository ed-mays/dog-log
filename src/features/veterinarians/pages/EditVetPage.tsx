import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function EditVetPage() {
  const { t } = useTranslation('veterinarians');
  return (
    <Box sx={{ p: 2 }} aria-label="edit veterinarian page">
      <Typography variant="h4" component="h2">
        {t('actions.edit', 'Edit veterinarian')}
      </Typography>
    </Box>
  );
}

import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function VetListPage() {
  const { t } = useTranslation('veterinarians');
  return (
    <Box sx={{ p: 2 }} aria-label="veterinarians list page">
      <Typography variant="h4" component="h2">
        {t('title', 'Veterinarians')}
      </Typography>
    </Box>
  );
}

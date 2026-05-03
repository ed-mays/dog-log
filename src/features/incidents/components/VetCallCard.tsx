import { Button } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { useTranslation } from 'react-i18next';
import { usePetVetsStore } from '@store/petVets.store';

// BR-10: one-tap tel: call action for pet's Primary Vet when linked.
// BR-11: hidden (not rendered) when no primary vet exists.

interface VetCallCardProps {
  petId: string;
}

export function VetCallCard({ petId }: VetCallCardProps) {
  const { t } = useTranslation();
  const { byPetId } = usePetVetsStore();

  const entry = byPetId[petId];
  const primaryVet =
    entry?.links.find(({ link }) => link.role === 'primary')?.vet ?? null;

  if (!primaryVet) return null;

  return (
    <Button
      component="a"
      href={`tel:${primaryVet.phone}`}
      startIcon={<PhoneIcon />}
      sx={{ minHeight: 44 }}
    >
      {t('incidents.callVet')}
    </Button>
  );
}

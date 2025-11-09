import { useTranslation } from 'react-i18next';
import type { Pet } from '@features/pets/types';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { Link } from 'react-router-dom';
import { loadNamespace } from '@i18n';
import { useEffect, useMemo, useState } from 'react';
import { usePetsStore } from '@store/pets.store';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PetCard from './PetCard';
import { LoadingIndicator } from '@components/common/LoadingIndicator/LoadingIndicator';
import { PetSortSelector } from './PetSortSelector';

type PetListProps = {
  pets: Pet[];
  dataTestId?: string;
};

const SORT_KEY = 'doglog:petList:sortOrder';

export function PetList({ dataTestId = 'pet-list' }: PetListProps) {
  const [nsReady, setNsReady] = useState(false);
  const pets = usePetsStore((s) => s.pets);
  const isFetching = usePetsStore((s) => s.isFetching);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadNamespace('petList'),
      loadNamespace('petProperties'),
      loadNamespace('common'),
    ]).then(() => {
      if (mounted) setNsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const { t, i18n } = useTranslation();

  const addPetEnabled = useFeatureFlag('addPetEnabled');

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    if (typeof window === 'undefined') return 'asc';
    const saved = localStorage.getItem(SORT_KEY);
    return saved === 'desc' || saved === 'asc'
      ? (saved as 'asc' | 'desc')
      : 'asc';
  });

  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sortOrder);
    } catch {
      // no-op: best-effort persistence
    }
  }, [sortOrder]);

  const sortedPets = useMemo(() => {
    const locale = i18n.language || 'en';
    const arr = [...pets];
    arr.sort((a, b) => {
      const diff = a.name.localeCompare(b.name, locale, {
        sensitivity: 'base',
      });
      return sortOrder === 'asc' ? diff : -diff;
    });
    return arr;
  }, [pets, sortOrder, i18n.language]);

  if (!nsReady) return null;
  if (isFetching) return <LoadingIndicator />;

  return (
    <div data-testid={dataTestId}>
      {sortedPets.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <PetSortSelector value={sortOrder} onChange={setSortOrder} />
          {addPetEnabled && (
            <Tooltip title={t('addPet', { ns: 'petList' })}>
              <IconButton
                component={Link}
                to="/pets/new"
                color="primary"
                size="large"
                data-testid="add-pet-button"
                aria-label={t('addPet', { ns: 'petList' })}
                sx={{ ml: 1 }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}

      {sortedPets.length === 0 ? (
        <div
          data-testid="no-pets-indicator"
          style={{ marginTop: '1rem', textAlign: 'center' }}
        >
          <Typography variant="body1" component="p">
            {t('noPetsLabel', { ns: 'petList' })}
          </Typography>
          {addPetEnabled && (
            <MuiLink component={Link} to="/pets/new">
              {t('addFirstPetCta', { ns: 'petList' })}
            </MuiLink>
          )}
        </div>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
            mt: 2,
          }}
          aria-label="pet card grid"
        >
          {sortedPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </Box>
      )}
    </div>
  );
}

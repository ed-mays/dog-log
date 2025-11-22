import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, TextField, Typography, Grid } from '@mui/material';
import { useAuthStore } from '@store/auth.store';
import { vetService } from '@services/vetService';
import type { Vet } from '@models/vets';
import { VetCard } from '../components/VetCard';

export default function VetListPage() {
  const { t } = useTranslation('veterinarians');
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [items, setItems] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const list = await vetService.searchVets(user.uid, '');
        if (mounted) setItems(list);
      } catch {
        // Swallow Firestore permission errors and show empty state
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  // Debounced telemetry
  useEffect(() => {
    const t = term.trim();
    if (!t) return;

    const timer = setTimeout(async () => {
      try {
        const { track } = await import('@services/analytics/analytics');
        track('vet_search', { term_length: t.length });
      } catch {
        /* no-op */
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [term]);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return items;
    return items.filter((v) => {
      const hay = [v.name, v.clinicName, ...(v.specialties ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, term]);

  return (
    <Box sx={{ p: 2 }} aria-label="veterinarians list page">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h2">
          {t('title', 'Veterinarians')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/vets/add')}>
          {t('actions.add')}
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t('list.searchPlaceholder', 'Search')}
          label={t('list.searchPlaceholder', 'Search')}
          size="small"
          inputProps={{ 'aria-label': t('list.searchPlaceholder', 'Search') }}
        />
      </Box>

      {!loading && filtered.length === 0 ? (
        <Typography variant="body1">
          {t('list.empty', 'No veterinarians yet')}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((v) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={v.id}>
              <VetCard vet={v} onClick={() => navigate(`/vets/${v.id}/edit`)} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useAuthStore } from '@store/auth.store';
import { vetService } from '@services/vetService';
import type { Vet } from '@models/vets';

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
        <List>
          {filtered.map((v) => (
            <ListItem key={v.id} disablePadding>
              <ListItemButton onClick={() => navigate(`/vets/${v.id}/edit`)}>
                <ListItemText
                  primary={v.name}
                  secondary={[v.clinicName, v.phone]
                    .filter(Boolean)
                    .join(' • ')}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

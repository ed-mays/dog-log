import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Autocomplete,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import type { Vet } from '@models/vets';
import VetForm, { type VetFormValues } from './VetForm';
import { vetService } from '@services/vetService';
import { useAuthStore } from '@store/auth.store';

export type VetSelectorProps = {
  label?: string;
  onSelect: (vet: Vet) => void;
};

type CreateOption = { id: '__create__'; name: string };

type Option = Vet | CreateOption;

function isCreateOption(opt: Option): opt is CreateOption {
  return (opt as CreateOption).id === '__create__';
}

export default function VetSelector({ label, onSelect }: VetSelectorProps) {
  const { t } = useTranslation('veterinarians');
  const user = useAuthStore((s) => s.user);
  const userId = user?.uid ?? '';

  const [openCreate, setOpenCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Vet[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let active = true;

    if (!userId) return;
    const query = inputValue.trim();

    // Avoid firing a search on mount or when the query is empty
    if (!query) return;

    // Debounce to coalesce rapid keystrokes and MUI-controlled updates
    const handle = setTimeout(async () => {
      if (!active) return;
      setLoading(true);
      try {
        const results = await vetService.searchVets(userId, query);
        if (active) setOptions(results);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [inputValue, userId]);

  const createNewLabel = useMemo(
    () => t('selector.createNew', { defaultValue: 'Create new vet…' }),
    [t]
  );

  const augmentedOptions: Option[] = [
    ...options,
    { id: '__create__', name: createNewLabel },
  ];

  function handleCreateSubmit(values: VetFormValues) {
    if (!userId) return;
    (async () => {
      try {
        const created = await vetService.createVet(userId, userId, values);
        // telemetry
        try {
          const { track } = await import('@services/analytics/analytics');
          track('vet_created');
        } catch {
          /* no-op: analytics optional */
        }
        onSelect(created);
        setOpenCreate(false);
      } catch {
        // VetForm already surfaces duplicate error via its own i18n
        // leave dialog open for user to correct
        /* no-op */
      }
    })();
  }

  return (
    <Box>
      <Autocomplete<Option>
        options={augmentedOptions}
        getOptionLabel={(opt) => opt.name || ''}
        filterOptions={(x) => x}
        loading={loading}
        onInputChange={(_e, val) => setInputValue(val)}
        onChange={(_e, val) => {
          if (!val) return;
          if (isCreateOption(val)) {
            setOpenCreate(true);
          } else {
            onSelect(val);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={
              label ?? t('link.add', { defaultValue: 'Link veterinarian' })
            }
            placeholder={t('list.searchPlaceholder', {
              defaultValue: 'Search',
            })}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            size="small"
          />
        )}
      />

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth>
        <DialogTitle>
          {t('actions.add', { defaultValue: 'Add veterinarian' })}
        </DialogTitle>
        <DialogContent>
          <VetForm
            title={t('actions.add')}
            initialValues={{
              name: '',
              phone: '',
              email: '',
              website: '',
              clinicName: '',
              address: {},
              specialties: [],
              notes: '',
            }}
            onSubmit={handleCreateSubmit}
            onCancel={() => setOpenCreate(false)}
            submitLabel={t('actions.add')}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

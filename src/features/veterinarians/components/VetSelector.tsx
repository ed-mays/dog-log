import { useMemo, useState } from 'react';
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
import { useVetSearch } from '../hooks/useVetSearch';
import { useCreateVet } from '../hooks/useCreateVet';
import { useAuthStore } from '@store/auth.store';
import { logger } from '@services/logService';

type VetSelectorProps = {
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
  const userId = user?.uid;

  const [openCreate, setOpenCreate] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { vets: options, loading } = useVetSearch(userId, inputValue.trim(), {
    debounceMs: 250,
  });
  const { createVet } = useCreateVet(userId, userId);

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
        const created = await createVet(values);

        onSelect(created);
        setOpenCreate(false);
      } catch (e) {
        // VetForm already surfaces duplicate error via its own i18n
        // leave dialog open for user to correct
        logger.error('vet: createVet error', { error: e });
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
          logger.debug('VetSelector options', augmentedOptions);
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

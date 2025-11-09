import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type SortOrder = 'asc' | 'desc';

interface Props {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

export function PetSortSelector({ value, onChange }: Props) {
  const { t } = useTranslation('petList');
  const labelId = 'pet-sort-label';

  return (
    <FormControl size="small">
      <InputLabel id={labelId}>{t('sort.label')}</InputLabel>
      <Select
        labelId={labelId}
        label={t('sort.label')}
        value={value}
        onChange={(e) => onChange(e.target.value as SortOrder)}
      >
        <MenuItem value="asc">{t('sort.asc')}</MenuItem>
        <MenuItem value="desc">{t('sort.desc')}</MenuItem>
      </Select>
    </FormControl>
  );
}

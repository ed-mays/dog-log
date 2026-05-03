import { Box, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIncidentStore } from '@store/useIncidentStore';
import type { Incident } from '@features/incidents/types';
import { chipCatalog } from '../chipCatalog';

// BR-7: chips toggleable by single-tap, no required minimum (no type required).
// BR-19: curated chip catalog updates when type changes.
// BR-32: toggled-on chips absent from the curated catalog remain visible in a
//        "carried over" group so caregivers don't perceive silent data loss.
// §D9: MUI Chip rendered as toggle button (aria-pressed). NFR-3: 44×44 tap target.

interface ObservationChipsProps {
  incident: Incident;
}

export function ObservationChips({ incident }: ObservationChipsProps) {
  const { t } = useTranslation();
  const { toggleChip } = useIncidentStore();

  const curatedChips = incident.type ? [...chipCatalog[incident.type]] : [];
  const curatedSet = new Set(curatedChips);
  const carryOverChips = incident.chips.filter((c) => !curatedSet.has(c));

  const handleTap = (chipId: string) => {
    void toggleChip(chipId);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {curatedChips.map((chipId) => {
          const selected = incident.chips.includes(chipId);
          return (
            <Chip
              key={chipId}
              label={t(`incidents.chips.${chipId}`)}
              onClick={() => handleTap(chipId)}
              aria-pressed={selected}
              color={selected ? 'primary' : 'default'}
              sx={{ minHeight: 44, minWidth: 44 }}
            />
          );
        })}
      </Box>
      {carryOverChips.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {carryOverChips.map((chipId) => (
            <Chip
              key={chipId}
              label={t(`incidents.chips.${chipId}`)}
              onClick={() => handleTap(chipId)}
              aria-pressed={true}
              color="primary"
              sx={{ minHeight: 44, minWidth: 44 }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

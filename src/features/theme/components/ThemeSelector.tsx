import { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { useThemeStore } from '@store/theme.store';
import type { ThemeMode } from '@store/theme.store';
import { THEME_MODES } from '@store/theme.store';
import { useTranslation } from 'react-i18next';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { lightTheme, darkTheme, caregiverTheme } from '../theme';

const swatchByMode: Record<ThemeMode, { bg: string; accent: string }> = {
  light: {
    bg: lightTheme.palette.background.default,
    accent: lightTheme.palette.primary.main,
  },
  dark: {
    bg: darkTheme.palette.background.default,
    accent: darkTheme.palette.primary.main,
  },
  caregiver: {
    bg: caregiverTheme.palette.background.default,
    accent: caregiverTheme.palette.primary.main,
  },
};

function Swatch({ mode }: { mode: ThemeMode }) {
  const { bg, accent } = swatchByMode[mode];
  return (
    <Box
      aria-hidden
      sx={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bg} 0% 50%, ${accent} 50% 100%)`,
        border: '1px solid',
        borderColor: 'divider',
      }}
    />
  );
}

export function ThemeSelector() {
  const { mode, setMode } = useThemeStore();
  const { t } = useTranslation('common');
  const themesEnabled = useFeatureFlag('themesEnabled');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!themesEnabled) {
    return null;
  }

  const open = Boolean(anchorEl);
  const tooltipLabel = t('theme.label', 'Theme');

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePick = (next: ThemeMode) => {
    setMode(next);
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title={tooltipLabel}>
        <IconButton
          onClick={handleOpen}
          color="inherit"
          aria-label={tooltipLabel}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <PaletteOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: { 'aria-label': tooltipLabel, role: 'menu' },
        }}
      >
        {THEME_MODES.map((m) => {
          const selected = m === mode;
          const label = t(`theme.modes.${m}`, defaultLabelFor(m));
          return (
            <MenuItem
              key={m}
              selected={selected}
              onClick={() => handlePick(m)}
              aria-checked={selected}
              role="menuitemradio"
            >
              <ListItemIcon>
                <Swatch mode={m} />
              </ListItemIcon>
              <ListItemText primary={label} />
              {selected && <CheckIcon fontSize="small" />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

function defaultLabelFor(m: ThemeMode): string {
  switch (m) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'caregiver':
      return 'Caregiver';
  }
}

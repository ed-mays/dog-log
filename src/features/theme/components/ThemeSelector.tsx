import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeStore } from '@store/theme.store';
import { useTranslation } from 'react-i18next';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';

export function ThemeSelector() {
  const { mode, toggleMode } = useThemeStore();
  const { t } = useTranslation('common');
  const themesEnabled = useFeatureFlag('themesEnabled');

  if (!themesEnabled) {
    return null;
  }

  const isLight = mode === 'light';
  const title = isLight
    ? t('theme.switchToDark', 'Switch to dark mode')
    : t('theme.switchToLight', 'Switch to light mode');

  return (
    <Tooltip title={title}>
      <IconButton onClick={toggleMode} color="inherit" aria-label={title}>
        {isLight ? <Brightness4Icon /> : <Brightness7Icon />}
      </IconButton>
    </Tooltip>
  );
}

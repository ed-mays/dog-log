import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import { Link as RouterLink } from 'react-router-dom';
import LogoutButton from '@features/authentication/components/GoogleAuth/LogoutButton.tsx';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@components/common/LanguageSelector/LanguageSelector.tsx';

export function NavigationBar() {
  const { t } = useTranslation('common');
  const APP_TITLE = 'Dog Log';
  const PETS_LABEL = t('nav.pets', 'Pets Default');

  return (
    <AppBar position="fixed" component="nav" aria-label="Primary">
      <Toolbar>
        {/* Brand: icon + title, clickable to home */}
        <IconButton
          color="inherit"
          aria-label="Home"
          component={RouterLink}
          to="/"
          edge="start"
          sx={{ mr: 1 }}
        >
          <PetsIcon titleAccess={PETS_LABEL} />
        </IconButton>
        <Typography
          component="h1"
          variant="h6"
          noWrap
          sx={{ flexGrow: 1, textDecoration: 'none' }}
        >
          <Box
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ textDecoration: 'none' }}
          >
            {APP_TITLE}
          </Box>
        </Typography>
        <Button
          color="inherit"
          component={RouterLink}
          to="/pets"
          sx={{ ml: 1 }}
        >
          {PETS_LABEL}
        </Button>
        <Box sx={{ ml: 2, mr: 1 }}>
          <LanguageSelector />
        </Box>
        <LogoutButton />
      </Toolbar>
    </AppBar>
  );
}

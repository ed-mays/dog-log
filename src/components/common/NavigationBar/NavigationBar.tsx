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

export function NavigationBar() {
  const APP_TITLE = 'Dog Log';
  const PETS_LABEL = 'Pets';

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
        <LogoutButton />
      </Toolbar>
    </AppBar>
  );
}

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
          <PetsIcon titleAccess="Pets" />
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
            Dog Log
          </Box>
        </Typography>
        <Button
          color="inherit"
          component={RouterLink}
          to="/pets"
          sx={{ ml: 1 }}
        >
          Pets
        </Button>
        <LogoutButton />
      </Toolbar>
    </AppBar>
  );
}

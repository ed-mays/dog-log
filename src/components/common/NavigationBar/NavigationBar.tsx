import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import { Link as RouterLink } from 'react-router-dom';

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
      </Toolbar>
    </AppBar>
  );
}

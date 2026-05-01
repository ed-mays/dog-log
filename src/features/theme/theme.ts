import { createTheme } from '@mui/material';

const baseTheme = {
  typography: {
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
  },
});

// Caregiver theme — warm-dark palette designed for the active-incident screen
// and other caregiving flows. Tone: warm, respectful, mobile-first, dark-only.
// Source: design memory + wireframe-v4-incident-types.html (2026-04-30 design session).
export const caregiverTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    background: {
      default: '#1A1208',
      paper: '#2A1F12',
    },
    text: {
      primary: '#F4E9D8',
      secondary: 'rgba(244, 233, 216, 0.55)',
    },
    primary: {
      main: '#FFB47A',
      contrastText: '#1A1208',
    },
    secondary: {
      main: '#A78BFA',
    },
    error: {
      main: '#FF6B5C',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#60A5FA',
    },
    success: {
      main: '#4ADE80',
    },
    divider: 'rgba(255, 255, 255, 0.06)',
  },
});

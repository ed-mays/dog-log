import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '@test-utils';
import { useTheme, Typography } from '@mui/material';

function Probe() {
  const theme = useTheme();
  return (
    <div>
      <Typography>{theme.typography.fontFamily}</Typography>
    </div>
  );
}

test('render wrapper provides MUI theme with Roboto font family', async () => {
  render(<Probe />);
  const text = await screen.findByText(/Roboto/);
  expect(text).toBeInTheDocument();
});

import React from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import type { Vet } from '@models/vets';

interface VetCardProps {
  vet: Vet;
  onClick: () => void;
}

export function VetCard({ vet, onClick }: VetCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom>
            {vet.name}
          </Typography>

          {vet.clinicName && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {vet.clinicName}
            </Typography>
          )}

          {vet.phone && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {vet.phone}
            </Typography>
          )}

          {vet.specialties && vet.specialties.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {vet.specialties.map((specialty) => (
                <Chip
                  key={specialty}
                  label={specialty}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

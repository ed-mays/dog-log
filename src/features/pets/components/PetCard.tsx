import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from '@mui/material';
import type { Pet } from '@features/pets/types';

// Basic Material UI PetCard structure
// - Container wraps the card (per MUI docs guidance)
// - Header image
// - Displays provided pet name and breed
export function PetCard({ pet }: { pet: Pet }) {
  return (
    <Box sx={{ maxWidth: 345 }}>
      <Card>
        <CardActionArea>
          <CardMedia
            component="img"
            height="140"
            image="https://via.placeholder.com/345x140?text=Pet+Image"
            alt="pet header"
          />
          <CardContent>
            <Typography gutterBottom variant="h6" component="h3">
              {pet.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pet.breed}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );
}

export default PetCard;

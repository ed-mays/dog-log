import { useTranslation } from 'react-i18next';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  IconButton,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Feeding } from '@features/feedings/types';

interface FeedingListProps {
  feedings: Feeding[];
  onDelete: (id: string) => void;
}

export function FeedingList({ feedings, onDelete }: FeedingListProps) {
  const { t } = useTranslation('feedings');

  if (feedings.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" align="center">
        {t('noFeedings', { defaultValue: 'No feedings recorded yet.' })}
      </Typography>
    );
  }

  return (
    <Paper elevation={0} variant="outlined">
      <List>
        {feedings.map((feeding, index) => (
          <ListItem
            key={feeding.id}
            divider={index < feedings.length - 1}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onDelete(feeding.id)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="subtitle1">
                    {feeding.foodType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feeding.date.toLocaleString()}
                  </Typography>
                </Box>
              }
              secondary={
                feeding.notes && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {feeding.notes}
                  </Typography>
                )
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

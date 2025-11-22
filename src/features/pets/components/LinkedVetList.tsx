import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List, ListItem, ListItemText, Link, Typography } from '@mui/material';
import type { PetVetLink, Vet } from '@models/vets';

interface LinkedVetListProps {
  loading: boolean;
  links: Array<{ link: PetVetLink; vet: Vet }>;
}

export function LinkedVetList({ loading, links }: LinkedVetListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('loading', { ns: 'common', defaultValue: 'Loading…' })}
      </Typography>
    );
  }

  if (links.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('noLinkedVets', {
          ns: 'veterinarians',
          defaultValue: 'No linked veterinarians',
        })}
      </Typography>
    );
  }

  return (
    <List>
      {links.map(({ link, vet }) => {
        const roleKey = `link.role.${link.role}` as const;
        const roleLabel = t(roleKey, { ns: 'veterinarians' });
        return (
          <ListItem key={link.id} sx={{ px: 0 }}>
            <ListItemText
              primary={
                <Link
                  component={RouterLink}
                  to={`/vets/${vet.id}/edit`}
                  underline="hover"
                >
                  {vet.name}
                </Link>
              }
              secondary={roleLabel}
            />
          </ListItem>
        );
      })}
    </List>
  );
}

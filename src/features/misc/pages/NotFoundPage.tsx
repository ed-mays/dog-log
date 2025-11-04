import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

export function NotFoundPage() {
  const { t } = useTranslation('common');
  const title = t('notFound.title', 'Page not found');
  const message = t(
    'notFound.message',
    'The page you are looking for does not exist.'
  );

  return (
    <main data-testid="not-found-page" aria-labelledby="not-found-heading">
      <Typography variant="h4" component="h1" id="not-found-heading">
        {title}
      </Typography>
      <Typography variant="body1" component="p">
        {message}
      </Typography>
    </main>
  );
}

export default NotFoundPage;

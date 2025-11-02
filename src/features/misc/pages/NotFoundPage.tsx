import React from 'react';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation('common');
  const title = t('notFound.title', 'Page not found');
  const message = t(
    'notFound.message',
    'The page you are looking for does not exist.'
  );

  return (
    <main data-testid="not-found-page" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">{title}</h1>
      <p>{message}</p>
    </main>
  );
}

export default NotFoundPage;

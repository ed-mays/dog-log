import { useTranslation } from 'react-i18next';
import GoogleLoginButton from '@features/authentication/components/GoogleLoginButton.tsx';
import { useEffect, useState } from 'react';
import { loadNamespace } from '@i18n';
import { Stack } from '@mui/material';

export function WelcomePage() {
  const [nsReady, setNsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('common')]).then(() => {
      if (mounted) setNsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const { t } = useTranslation();

  if (!nsReady) return null;
  return (
    <Stack direction="column" justifyContent="center">
      <h1>{t('welcomePage.welcomeHeader', 'Welcome to Dog Log!')}</h1>
      <p>{t('welcomePage.welcomeSubtitle', 'Please sign in to continue.')}</p>
      <GoogleLoginButton />
    </Stack>
  );
}

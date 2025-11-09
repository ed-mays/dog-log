import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { loadNamespace } from '@i18n';
import { Stack, Typography } from '@mui/material';
import GoogleLoginButton from '@features/authentication/components/GoogleAuth/GoogleLoginButton';

export const WelcomePage: React.FC = () => {
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
      <Typography variant="h4" component="h1">
        {t('welcomePage.welcomeHeader', 'Welcome to Dog Log!')}
      </Typography>
      <Typography variant="body1" component="p">
        {t('welcomePage.welcomeSubtitle', 'Please sign in to continue.')}
      </Typography>
      <GoogleLoginButton disabled={false} />
    </Stack>
  );
};

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store.ts';
import { loadNamespace } from '../../../../i18n.ts';
import { Button } from '@mui/material';
import { logger } from '@services/logService.ts';

export type LoginButtonProps = {
  className?: string;
  disabled?: boolean;
};

const GoogleLoginButton: React.FC<LoginButtonProps> = ({
  className,
  disabled,
}) => {
  const [nsReady, setNsReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('common'), loadNamespace('auth')]).then(() => {
      if (mounted) setNsReady(true);
      logger.info('Loaded i18n', { source: 'GoogleLoginButton' });
    });
    return () => {
      mounted = false;
    };
  }, []);

  const { t } = useTranslation();
  const signIn = useAuthStore((s) => s.signInWithGoogle);
  const initializing = useAuthStore((s) => s.initializing);
  if (!nsReady) return null;

  const onClick = async () => {
    try {
      await signIn();
      logger.info('Signed in with Google', { source: 'GoogleLoginButton' });
    } catch {
      // Error state is handled by the auth store and rendered by consumers.
    }
  };

  return (
    <Button
      type="button"
      variant="contained"
      className={className}
      onClick={onClick}
      disabled={disabled || initializing}
      aria-busy={initializing || undefined}
      aria-label={t('continueWithGoogle', 'Continue with Google')}
      data-testid="login-button"
    >
      {t('google.continueWithGoogle', 'Continue with Google Default', {
        ns: 'auth',
      })}
    </Button>
  );
};

export default GoogleLoginButton;

/* TODO: ADDITIONAL CLEANUP
- I don't like the empty catch block, I need to understand why that is that way
 */

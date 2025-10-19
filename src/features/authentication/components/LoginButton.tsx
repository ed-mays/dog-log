import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store.tsx';
import { loadNamespace } from '@i18n';
import { Button } from '@mui/material';

export type LoginButtonProps = {
  className?: string;
  disabled?: boolean;
};

const LoginButton: React.FC<LoginButtonProps> = ({ className, disabled }) => {
  const [nsReady, setNsReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.all([loadNamespace('common'), loadNamespace('auth')]).then(() => {
      if (mounted) setNsReady(true);
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

export default LoginButton;

/* TODO: ADDITIONAL CLEANUP
- Rename to GoogleLoginButton?
- Create Auth i18n namespace and integrate with app
- I don't like the empty catch block, I need to understand why that is that way

 */

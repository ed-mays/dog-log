import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store.tsx';
import { loadNamespace } from '@i18n';

type Props = {
  className?: string;
  disabled?: boolean;
};

const LoginButton: React.FC<Props> = ({ className, disabled }) => {
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
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || initializing}
      aria-busy={initializing || undefined}
      aria-label={t('continueWithGoogle', 'Continue with Google')}
      data-testid="login-button"
    >
      {t('continueWithGoogle', 'Continue with Google')}
    </button>
  );
};

export default LoginButton;

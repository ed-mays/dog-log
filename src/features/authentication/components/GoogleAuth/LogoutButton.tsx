import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';
import { useResetStores } from '@store/useResetStores';
import { useNavigate } from 'react-router-dom';
import { loadNamespace } from '@i18n';
import { Button } from '@mui/material';

type Props = {
  className?: string;
  disabled?: boolean;
};

const LogoutButton: React.FC<Props> = ({ className, disabled }) => {
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
  const signOut = useAuthStore((s) => s.signOut);
  const initializing = useAuthStore((s) => s.initializing);
  const navigate = useNavigate();
  const resetStores = useResetStores();
  if (!nsReady) return null;

  const onClick = async () => {
    await signOut();
    resetStores();
    navigate('/welcome', { replace: true });
  };
  const ariaLabel = t('auth:logout', 'Log out Default');

  return (
    <Button
      color="inherit"
      variant="outlined"
      sx={{ ml: 1 }}
      className={className}
      onClick={onClick}
      disabled={disabled || initializing}
      role="button"
      data-testid="logout-button"
      aria-busy={initializing || undefined}
      aria-label={ariaLabel}
      name={ariaLabel}
    >
      {t('auth:logout', 'Log out Default')}
    </Button>
  );
};

export default LogoutButton;

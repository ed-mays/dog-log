import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';
import { useNavigate } from 'react-router-dom';

type Props = {
  className?: string;
  disabled?: boolean;
};

const LogoutButton: React.FC<Props> = ({ className, disabled }) => {
  const { t } = useTranslation('common');
  const signOut = useAuthStore((s) => s.signOut);
  const initializing = useAuthStore((s) => s.initializing);
  const navigate = useNavigate();

  const onClick = async () => {
    await signOut();
    navigate('/welcome', { replace: true });
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || initializing}
      aria-busy={initializing || undefined}
      aria-label={t('logout', 'Log out')}
    >
      {t('logout', 'Log out')}
    </button>
  );
};

export default LogoutButton;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';

type Props = {
  className?: string;
  disabled?: boolean;
};

const LogoutButton: React.FC<Props> = ({ className, disabled }) => {
  const { t } = useTranslation('common');
  const signOut = useAuthStore((s) => s.signOut);
  const { initializing } = useAuthStore((s) => ({
    initializing: s.initializing,
  }));

  const onClick = async () => {
    await signOut();
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || initializing}
      aria-busy={initializing || undefined}
    >
      {t('logout', 'Log out')}
    </button>
  );
};

export default LogoutButton;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';

type Props = {
  className?: string;
  disabled?: boolean;
};

const LoginButton: React.FC<Props> = ({ className, disabled }) => {
  const { t } = useTranslation('common');
  const signIn = useAuthStore((s) => s.signInWithGoogle);
  const initializing = useAuthStore((s) => s.initializing);

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
    >
      {t('continueWithGoogle', 'Continue with Google')}
    </button>
  );
};

export default LoginButton;

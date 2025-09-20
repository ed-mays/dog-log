import React from 'react';
import LoginButton from '@components/common/Auth/LoginButton';
import { useTranslation } from 'react-i18next';
import { useAuthStatus } from '@store/auth.store';
import { toErrorMessage } from '@/utils/errors.tsx';

const SignupComponent: React.FC = () => {
  const { t } = useTranslation('common');
  const { initializing, error } = useAuthStatus();
  const errorTextBase = t('error', 'Error...');
  const errorDetail = toErrorMessage(error);
  const errorText = errorDetail
    ? `${errorTextBase} ${typeof errorDetail === 'string' ? errorDetail : String(errorDetail)}`
    : errorTextBase;

  return (
    <section aria-label={t('authentication', 'Authentication')}>
      <h2>{t('welcomeHeader', 'Welcome')}</h2>
      <p>{t('welcomeSubtitle', 'Sign in to continue')}</p>
      {initializing && (
        <p role="status" aria-live="polite">
          {t('loading', 'Loading…')}
        </p>
      )}
      {errorText && <p role="alert">{t('error', 'Error...')}</p>}
      <LoginButton />
    </section>
  );
};

export default SignupComponent;

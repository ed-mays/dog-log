import React from 'react';
import LoginButton from '@components/common/Auth/LoginButton';
import { useTranslation } from 'react-i18next';

const SignupComponent: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <section aria-label={t('authentication', 'Authentication')}>
      <h2>{t('welcomeHeader', 'Welcome')}</h2>
      <p>{t('welcomeSubtitle', 'Sign in to continue')}</p>
      <LoginButton />
    </section>
  );
};

export default SignupComponent;

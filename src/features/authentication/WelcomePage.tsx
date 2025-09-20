import React from 'react';
import { useTranslation } from 'react-i18next';
import LoginButton from '@components/common/Auth/LoginButton';
import { useAuthUser } from '@store/auth.store';
import { Navigate, useLocation } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  const { t } = useTranslation('common');
  const user = useAuthUser();
  const location = useLocation();

  if (user) {
    const from = (location.state as { from?: Location } | undefined)?.from;
    let to = '/pets';
    if (from && typeof from === 'object' && 'pathname' in from) {
      to = (from as Location).pathname;
    }
    return <Navigate to={to} replace />;
  }

  return (
    <main aria-labelledby="welcome-heading">
      <h1 id="welcome-heading">{t('welcomeHeader', 'Welcome')}</h1>
      <p>{t('welcomeSubtitle', 'Sign in to continue')}</p>
      <LoginButton />
    </main>
  );
};

export default WelcomePage;

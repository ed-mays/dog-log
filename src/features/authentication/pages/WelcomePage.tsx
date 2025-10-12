import { useTranslation } from 'react-i18next';
import LoginButton from '@features/authentication/components/LoginButton';
import { useEffect, useState } from 'react';
import { loadNamespace } from '@i18n';

export function WelcomePage() {
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

  if (!nsReady) return null;
  return (
    <div className="@container">
      <div className="flex flex-col p4 justify-center">
        <h1 className="text-6xl font-bold pb-10">
          {t('welcomePage.welcomeHeader', 'Welcome to Dog Log!')}
        </h1>
        <p className="text-3xl pb-5">
          {t('welcomePage.welcomeSubtitle', 'Please sign in to continue.')}
        </p>
        <LoginButton className="bg-blue-500 hover:border-blue-950 hover: border-2 text-white p-6 rounded shadow" />
      </div>
    </div>
  );
}

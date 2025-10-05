import { useTranslation } from 'react-i18next';
import LoginButton from '@components/common/Auth/LoginButton';
import styles from './WelcomePage.module.css';

export function WelcomePage() {
  const { t } = useTranslation('common');

  return (
    <div className={styles.welcomeContainer}>
      <h1>{t('welcome.title', 'Welcome to Dog Log!')}</h1>
      <p>{t('welcome.message', 'Please sign in to continue.')}</p>
      <LoginButton />
    </div>
  );
}

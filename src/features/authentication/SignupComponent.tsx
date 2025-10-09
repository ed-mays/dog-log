import React from 'react';
import LoginButton from '@components/common/Auth/LoginButton';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/auth.store';
import { toErrorMessage } from '@utils/errors.tsx';

type FirebaseAuthError = { code?: string; message?: string } | unknown;

type FirebaseErrorKey =
  | 'firebaseErrors.popupClosedByUser'
  | 'firebaseErrors.cancelledPopupRequest'
  | 'firebaseErrors.popupBlocked'
  | 'firebaseErrors.networkRequestFailed'
  | 'firebaseErrors.generic';

function mapFirebaseErrorKey(err: FirebaseAuthError): FirebaseErrorKey | null {
  const code = (err as { code?: string })?.code;
  if (!code) return null;
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'firebaseErrors.popupClosedByUser';
    case 'auth/cancelled-popup-request':
      return 'firebaseErrors.cancelledPopupRequest';
    case 'auth/popup-blocked':
      return 'firebaseErrors.popupBlocked';
    case 'auth/network-request-failed':
      return 'firebaseErrors.networkRequestFailed';
    default:
      return 'firebaseErrors.generic';
  }
}

const SignupComponent: React.FC = () => {
  const { t } = useTranslation('common');
  const initializing = useAuthStore((s) => s.initializing);
  const error = useAuthStore((s) => s.error);
  const errorTextBase = t('error', 'Error...');
  const codeKey = mapFirebaseErrorKey(error);
  const errorDetail = toErrorMessage(error);
  let localizedDetail: string | undefined = undefined;
  if (error) {
    const key: FirebaseErrorKey = codeKey ?? 'firebaseErrors.generic';
    localizedDetail = t(key, {
      defaultValue: errorDetail || 'Authentication failed.',
    });
  }
  const errorText = localizedDetail
    ? `${errorTextBase} ${typeof localizedDetail === 'string' ? localizedDetail : String(localizedDetail)}`
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
      {Boolean(error) && <p role="alert">{errorText}</p>}
      <LoginButton />
    </section>
  );
};

export default SignupComponent;

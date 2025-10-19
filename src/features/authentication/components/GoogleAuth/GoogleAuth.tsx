import GoogleLoginButton from './GoogleLoginButton';
import LogoutButton from './LogoutButton';
import { useAuthStore } from '@store/auth.store';

export const GoogleAuth = () => {
  const { user } = useAuthStore();

  return user ? <LogoutButton /> : <GoogleLoginButton />;
};

import GoogleLoginButton from './GoogleLoginButton';
import LogoutButton from './LogoutButton';
import { useAuthStore } from '@store/auth.store.ts';
import React from 'react';

type Props = { disabled?: boolean };

export const GoogleAuth: React.FC<Props> = ({ disabled }) => {
  const { user } = useAuthStore();

  return user ? (
    <LogoutButton disabled={disabled} />
  ) : (
    <GoogleLoginButton disabled={disabled} />
  );
};

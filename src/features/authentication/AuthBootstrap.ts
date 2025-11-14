import React from 'react';
import { useAuthStore } from '@store/auth.store';

const AuthBootstrap: React.FC = () => {
  const init = useAuthStore((s) => s.initAuthListener);
  React.useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);
  return null;
};

export default AuthBootstrap;

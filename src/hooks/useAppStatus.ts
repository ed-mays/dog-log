import { useUiStore } from '@store/ui.store';
import { useAuthStore } from '@store/auth.store';
import { useIsAuthenticated } from '@features/authentication/hooks/useIsAuthenticated';
import type { UiState } from '@testUtils/mocks/mockStores.ts';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from '@utils/errors.ts';

export function useAppStatus() {
  const appLoading = useUiStore((state: UiState): boolean => state.loading);
  const appError = useUiStore((state: UiState): Error | null => state.error);
  const { initializing } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();

  const { t } = useTranslation('common');

  const errorTextBase = t('error', 'Default Error...');
  const errorDetail = toErrorMessage(appError);
  const errorText = errorDetail
    ? `${errorTextBase} ${String(errorDetail)}`
    : errorTextBase;

  return {
    appLoading,
    appError,
    initializing,
    isAuthenticated,
    errorDetail,
    errorText,
  };
}

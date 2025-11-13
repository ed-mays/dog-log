import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStatus } from './useAppStatus';

// Mock dependencies
vi.mock('@store/ui.store', () => ({
  useUiStore: vi.fn(),
}));
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@features/authentication/hooks/useIsAuthenticated', () => ({
  useIsAuthenticated: vi.fn(),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
  }),
}));
vi.mock('@utils/errors', () => ({
  toErrorMessage: vi.fn(),
}));

// Grab references to the mocks
const mockUiStore = (await import('@store/ui.store'))
  .useUiStore as unknown as ReturnType<typeof vi.fn>;
const mockAuthStore = (await import('@store/auth.store'))
  .useAuthStore as unknown as ReturnType<typeof vi.fn>;
const mockIsAuthenticated = (
  await import('@features/authentication/hooks/useIsAuthenticated')
).useIsAuthenticated as unknown as ReturnType<typeof vi.fn>;
const mockToErrorMessage = (await import('@utils/errors'))
  .toErrorMessage as unknown as ReturnType<typeof vi.fn>;

describe('useAppStatus', () => {
  beforeEach(() => {
    mockUiStore.mockImplementation((selector) =>
      selector({ loading: false, error: null })
    );
    mockAuthStore.mockReturnValue({ initializing: false });
    mockIsAuthenticated.mockReturnValue(false);
    mockToErrorMessage.mockReturnValue(null);
  });

  it('returns the correct default status', () => {
    const { result } = renderHook(() => useAppStatus());
    expect(result.current.appLoading).toBe(false);
    expect(result.current.initializing).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.appError).toBe(null);
    expect(result.current.errorDetail).toBe(null);
    expect(result.current.errorText).toBe('Default Error...');
  });

  it('returns error strings when error exists', () => {
    mockUiStore.mockImplementation((selector) =>
      selector({ loading: false, error: 'boom' })
    );
    mockToErrorMessage.mockReturnValue('Boom!');
    const { result } = renderHook(() => useAppStatus());
    expect(result.current.errorDetail).toBe('Boom!');
    expect(result.current.errorText).toBe('Default Error... Boom!');
  });
});

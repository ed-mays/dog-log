import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, beforeEach, test, expect, type Mock } from 'vitest';
import { usePetDetails } from './usePetDetails';
import { makePet } from '@testUtils/factories/makePet';
import { petVetService } from '@services/petVetService';
import { logger } from '@services/logService';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';

// Mocks
const mockNavigate = vi.fn();
const mockParams = { id: '1' };

vi.mock('react-router-dom', () => ({
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
}));

vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@featureFlags/hooks/useFeatureFlag', () => ({
  useFeatureFlag: vi.fn(),
}));

vi.mock('@services/petVetService', () => ({
  petVetService: {
    getPetVets: vi.fn(),
  },
}));

vi.mock('@services/logService', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@i18n', () => ({
  loadNamespace: vi.fn().mockResolvedValue(undefined),
}));

describe('usePetDetails', () => {
  let mockUsePetsStore: Mock;
  let mockUseAuthStore: Mock;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Setup store mocks
    mockUsePetsStore = (await import('@store/pets.store'))
      .usePetsStore as unknown as Mock;
    mockUseAuthStore = (await import('@store/auth.store'))
      .useAuthStore as unknown as Mock;

    // Default store implementations
    mockUsePetsStore.mockImplementation((selector) =>
      selector({
        pets: [makePet({ id: '1', name: 'Buddy' })],
        deletePet: vi.fn(),
      })
    );

    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        user: { uid: 'user-1' },
      })
    );

    // Default feature flags
    (useFeatureFlag as Mock).mockReturnValue(false);
  });

  test('returns pet data when found', async () => {
    const { result } = renderHook(() => usePetDetails());

    await waitFor(() => {
      expect(result.current.nsReady).toBe(true);
    });

    expect(result.current.pet).toEqual(
      expect.objectContaining({ id: '1', name: 'Buddy' })
    );
    expect(result.current.error).toBeNull();
  });

  test('returns undefined pet when not found', async () => {
    mockParams.id = '999'; // Non-existent ID

    const { result } = renderHook(() => usePetDetails());

    await waitFor(() => {
      expect(result.current.nsReady).toBe(true);
    });

    expect(result.current.pet).toBeUndefined();

    // Reset params for other tests
    mockParams.id = '1';
  });

  test('loads vet links when flags enabled', async () => {
    (useFeatureFlag as Mock).mockImplementation((flag) => {
      if (flag === 'vetsEnabled') return true;
      if (flag === 'vetLinkingEnabled') return true;
      return false;
    });

    const mockLinks = [{ link: { id: 'l1' }, vet: { id: 'v1' } }];
    (petVetService.getPetVets as Mock).mockResolvedValue(mockLinks);

    const { result } = renderHook(() => usePetDetails());

    // Should start loading
    expect(result.current.loadingVets).toBe(true);

    await waitFor(() => {
      expect(result.current.loadingVets).toBe(false);
    });

    expect(result.current.vetLinks).toEqual(mockLinks);
    expect(petVetService.getPetVets).toHaveBeenCalledWith('user-1', '1');
  });

  test('handles vet loading error', async () => {
    (useFeatureFlag as Mock).mockImplementation((flag) => {
      if (flag === 'vetsEnabled') return true;
      if (flag === 'vetLinkingEnabled') return true;
      return false;
    });

    const error = new Error('Fetch failed');
    (petVetService.getPetVets as Mock).mockRejectedValue(error);

    const { result } = renderHook(() => usePetDetails());

    await waitFor(() => {
      expect(result.current.loadingVets).toBe(false);
    });

    expect(logger.debug).toHaveBeenCalledWith(
      'Failed to load vet links for PetDetailsPage',
      { error }
    );
    expect(result.current.vetLinks).toEqual([]);
  });

  test('does not load vets if flags disabled', async () => {
    (useFeatureFlag as Mock).mockReturnValue(false);

    const { result } = renderHook(() => usePetDetails());

    await waitFor(() => {
      expect(result.current.nsReady).toBe(true);
    });

    expect(petVetService.getPetVets).not.toHaveBeenCalled();
    expect(result.current.loadingVets).toBe(false);
  });

  test('handleDelete calls store and navigates on success', async () => {
    const deletePetMock = vi.fn().mockResolvedValue(undefined);
    mockUsePetsStore.mockImplementation((selector) =>
      selector({
        pets: [makePet({ id: '1' })],
        deletePet: deletePetMock,
      })
    );

    const { result } = renderHook(() => usePetDetails());

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(deletePetMock).toHaveBeenCalledWith('1');
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('handleDelete sets error on failure', async () => {
    const deletePetMock = vi.fn().mockRejectedValue(new Error('Delete failed'));
    mockUsePetsStore.mockImplementation((selector) =>
      selector({
        pets: [makePet({ id: '1' })],
        deletePet: deletePetMock,
      })
    );

    const { result } = renderHook(() => usePetDetails());

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(deletePetMock).toHaveBeenCalledWith('1');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe('errors.deleteFailed');
  });

  test('handleDelete does nothing if pet is undefined', async () => {
    mockParams.id = '999';
    const deletePetMock = vi.fn();
    mockUsePetsStore.mockImplementation((selector) =>
      selector({
        pets: [],
        deletePet: deletePetMock,
      })
    );

    const { result } = renderHook(() => usePetDetails());

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(deletePetMock).not.toHaveBeenCalled();

    mockParams.id = '1';
  });
});

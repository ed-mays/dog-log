import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useVetSearch } from './useVetSearch';
import { vetService } from '@services/vetService';
import type { Vet } from '@models/vets';

vi.mock('@services/vetService', () => ({
  vetService: {
    searchVets: vi.fn(),
  },
}));

describe('useVetSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when userId is undefined', () => {
    const { result } = renderHook(() => useVetSearch(undefined, ''));
    expect(result.current.vets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(vetService.searchVets).not.toHaveBeenCalled();
  });

  it('fetches vets immediately when no debounce', async () => {
    const mockVets = [{ id: 'v1', name: 'Dr. A' }] as Vet[];
    vi.mocked(vetService.searchVets).mockResolvedValue(mockVets);

    const { result } = renderHook(() => useVetSearch('user-1', ''));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(vetService.searchVets).toHaveBeenCalledWith('user-1', '');
    expect(result.current.vets).toEqual(mockVets);
  });

  it('refetches when term changes', async () => {
    vi.mocked(vetService.searchVets).mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ term }) => useVetSearch('user-1', term),
      { initialProps: { term: '' } }
    );
    await waitFor(() =>
      expect(vetService.searchVets).toHaveBeenLastCalledWith('user-1', '')
    );

    rerender({ term: 'rex' });
    await waitFor(() =>
      expect(vetService.searchVets).toHaveBeenLastCalledWith('user-1', 'rex')
    );
  });

  it('debounces when debounceMs is provided', async () => {
    vi.useFakeTimers();
    vi.mocked(vetService.searchVets).mockResolvedValue([]);

    const { rerender } = renderHook(
      ({ term }) => useVetSearch('user-1', term, { debounceMs: 250 }),
      { initialProps: { term: 'a' } }
    );

    expect(vetService.searchVets).not.toHaveBeenCalled();

    rerender({ term: 'ab' });
    expect(vetService.searchVets).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(vetService.searchVets).toHaveBeenCalledTimes(1);
    expect(vetService.searchVets).toHaveBeenCalledWith('user-1', 'ab');

    vi.useRealTimers();
  });

  it('sets vets to empty list on error (does not throw)', async () => {
    vi.mocked(vetService.searchVets).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useVetSearch('user-1', ''));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.vets).toEqual([]);
  });
});

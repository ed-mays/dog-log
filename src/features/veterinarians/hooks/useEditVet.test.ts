import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEditVet } from './useEditVet';
import { vetService } from '@services/vetService';
import type { Vet } from '@models/vets';

vi.mock('@services/vetService', () => ({
  vetService: {
    getVet: vi.fn(),
    updateVet: vi.fn(),
  },
}));

describe('useEditVet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not load when userId is undefined', async () => {
    const { result } = renderHook(() => useEditVet(undefined, 'vet-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(vetService.getVet).not.toHaveBeenCalled();
    expect(result.current.vet).toBeNull();
  });

  it('loads the vet on mount', async () => {
    const v = { id: 'vet-1', name: 'Dr. A' } as Vet;
    vi.mocked(vetService.getVet).mockResolvedValue(v);

    const { result } = renderHook(() => useEditVet('user-1', 'vet-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(vetService.getVet).toHaveBeenCalledWith('user-1', 'vet-1');
    expect(result.current.vet).toEqual(v);
    expect(result.current.loadError).toBeNull();
  });

  it('captures load error and surfaces null vet', async () => {
    const err = new Error('forbidden');
    vi.mocked(vetService.getVet).mockRejectedValue(err);

    const { result } = renderHook(() => useEditVet('user-1', 'vet-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.vet).toBeNull();
    expect(result.current.loadError).toBe(err);
  });

  it('updates the vet and refreshes local state', async () => {
    const initial = { id: 'vet-1', name: 'Old Name' } as Vet;
    const next = { id: 'vet-1', name: 'New Name' } as Vet;
    vi.mocked(vetService.getVet).mockResolvedValue(initial);
    vi.mocked(vetService.updateVet).mockResolvedValue(next);

    const { result } = renderHook(() => useEditVet('user-1', 'vet-1'));

    await waitFor(() => expect(result.current.vet).toEqual(initial));

    let returned: Vet | undefined;
    await act(async () => {
      returned = await result.current.updateVet({ name: 'New Name' });
    });

    expect(vetService.updateVet).toHaveBeenCalledWith('user-1', 'vet-1', {
      name: 'New Name',
    });
    expect(returned).toEqual(next);
    expect(result.current.vet).toEqual(next);
    expect(result.current.updateError).toBeNull();
  });

  it('captures update error and rethrows', async () => {
    vi.mocked(vetService.getVet).mockResolvedValue({ id: 'vet-1' } as Vet);
    const err = new Error('duplicate');
    vi.mocked(vetService.updateVet).mockRejectedValue(err);

    const { result } = renderHook(() => useEditVet('user-1', 'vet-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.updateVet({ name: 'X' });
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBe(err);
    expect(result.current.updateError).toBe(err);
  });

  it('throws from updateVet when user is not authenticated', async () => {
    const { result } = renderHook(() => useEditVet(undefined, 'vet-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.updateVet({ name: 'X' });
      })
    ).rejects.toThrow('User not authenticated');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateVet } from './useCreateVet';
import { vetService } from '@services/vetService';
import type { Vet } from '@models/vets';

vi.mock('@services/vetService', () => ({
  vetService: {
    createVet: vi.fn(),
  },
}));

const VALID_INPUT = {
  name: 'Dr. Smith',
  phone: '555-1234',
};

describe('useCreateVet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when user is not authenticated', async () => {
    const { result } = renderHook(() => useCreateVet(undefined, undefined));

    await expect(
      act(async () => {
        await result.current.createVet(VALID_INPUT);
      })
    ).rejects.toThrow('User not authenticated');
    expect(vetService.createVet).not.toHaveBeenCalled();
  });

  it('delegates to vetService.createVet', async () => {
    const created = { id: 'v1', name: 'Dr. Smith' } as Vet;
    vi.mocked(vetService.createVet).mockResolvedValue(created);

    const { result } = renderHook(() => useCreateVet('user-1', 'user-1'));

    let returned: Vet | undefined;
    await act(async () => {
      returned = await result.current.createVet(VALID_INPUT);
    });

    expect(vetService.createVet).toHaveBeenCalledWith(
      'user-1',
      'user-1',
      VALID_INPUT
    );
    expect(returned).toEqual(created);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('captures error and rethrows', async () => {
    const err = new Error('duplicate');
    vi.mocked(vetService.createVet).mockRejectedValue(err);

    const { result } = renderHook(() => useCreateVet('user-1', 'user-1'));

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.createVet(VALID_INPUT);
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBe(err);
    expect(result.current.error).toBe(err);
    expect(result.current.loading).toBe(false);
  });
});

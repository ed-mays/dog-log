import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePetVets } from './usePetVets';
import { usePetVetsStore } from '@store/petVets.store';
import { petVetService } from '@services/petVetService';
import type { PetVetLink, Vet } from '@models/vets';

vi.mock('@services/petVetService', () => ({
  petVetService: {
    getPetVets: vi.fn(),
    linkVetToPet: vi.fn(),
    unlinkVetFromPet: vi.fn(),
    setPrimaryVet: vi.fn(),
    updateLink: vi.fn(),
  },
}));

const mkLink = (id: string, role: PetVetLink['role'] = 'other'): PetVetLink =>
  ({ id, vetId: `v${id}`, petId: 'pet-1', role }) as PetVetLink;
const mkVet = (id: string): Vet => ({ id, name: `Vet ${id}` }) as Vet;

describe('usePetVets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePetVetsStore.setState({
      byPetId: {},
      _inFlight: new Set<string>(),
    });
  });

  it('does not fetch when disabled', () => {
    renderHook(() => usePetVets('user-1', 'pet-1', { enabled: false }));
    expect(petVetService.getPetVets).not.toHaveBeenCalled();
  });

  it('does not fetch when userId or petId missing', () => {
    renderHook(() => usePetVets(undefined, 'pet-1'));
    renderHook(() => usePetVets('user-1', undefined));
    expect(petVetService.getPetVets).not.toHaveBeenCalled();
  });

  it('fetches on mount and exposes links', async () => {
    const link = mkLink('l1');
    const vet = mkVet('v1');
    vi.mocked(petVetService.getPetVets).mockResolvedValue([{ link, vet }]);

    const { result } = renderHook(() => usePetVets('user-1', 'pet-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.links).toEqual([{ link, vet }]);
  });

  it('dedupes when multiple instances mount for the same petId', async () => {
    vi.mocked(petVetService.getPetVets).mockResolvedValue([]);

    renderHook(() => usePetVets('user-1', 'pet-1'));
    renderHook(() => usePetVets('user-1', 'pet-1'));
    renderHook(() => usePetVets('user-1', 'pet-1'));

    await waitFor(() =>
      expect(petVetService.getPetVets).toHaveBeenCalledTimes(1)
    );
  });

  it('linkVet appends through the store', async () => {
    vi.mocked(petVetService.getPetVets).mockResolvedValue([]);
    const link = mkLink('l1');
    const vet = mkVet('v1');
    vi.mocked(petVetService.linkVetToPet).mockResolvedValue(link);

    const { result } = renderHook(() => usePetVets('user-1', 'pet-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.linkVet('v1', vet);
    });

    expect(result.current.links).toEqual([{ link, vet }]);
  });

  it('unlinkVet removes through the store', async () => {
    const link = mkLink('l1');
    const vet = mkVet('v1');
    vi.mocked(petVetService.getPetVets).mockResolvedValue([{ link, vet }]);
    vi.mocked(petVetService.unlinkVetFromPet).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePetVets('user-1', 'pet-1'));

    await waitFor(() => expect(result.current.links).toHaveLength(1));

    await act(async () => {
      await result.current.unlinkVet('l1');
    });

    expect(result.current.links).toEqual([]);
  });
});

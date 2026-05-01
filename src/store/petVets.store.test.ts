import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePetVetsStore } from './petVets.store';
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

const mkLink = (
  id: string,
  vetId: string,
  role: PetVetLink['role'],
  previousNonPrimaryRole?: Exclude<PetVetLink['role'], 'primary'>
): PetVetLink =>
  ({
    id,
    vetId,
    petId: 'pet-1',
    role,
    previousNonPrimaryRole,
  }) as PetVetLink;

const mkVet = (id: string, name: string): Vet => ({ id, name }) as Vet;

describe('petVets.store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePetVetsStore.setState({
      byPetId: {},
      _inFlight: new Set<string>(),
    });
  });

  describe('fetchPetVets', () => {
    it('loads links into the keyed cache', async () => {
      const links = [
        { link: mkLink('l1', 'v1', 'primary'), vet: mkVet('v1', 'Dr. A') },
      ];
      vi.mocked(petVetService.getPetVets).mockResolvedValue(links);

      await usePetVetsStore.getState().fetchPetVets('user-1', 'pet-1');

      expect(petVetService.getPetVets).toHaveBeenCalledWith('user-1', 'pet-1');
      expect(usePetVetsStore.getState().byPetId['pet-1']).toEqual({
        links,
        loading: false,
        error: null,
      });
    });

    it('dedupes concurrent calls for the same petId', async () => {
      let resolve!: (v: Array<{ link: PetVetLink; vet: Vet }>) => void;
      vi.mocked(petVetService.getPetVets).mockImplementation(
        () =>
          new Promise<Array<{ link: PetVetLink; vet: Vet }>>((r) => {
            resolve = r;
          })
      );

      const a = usePetVetsStore.getState().fetchPetVets('user-1', 'pet-1');
      const b = usePetVetsStore.getState().fetchPetVets('user-1', 'pet-1');

      // Second call should short-circuit (no new network call enqueued)
      expect(petVetService.getPetVets).toHaveBeenCalledTimes(1);

      resolve([]);
      await Promise.all([a, b]);
    });

    it('captures errors without throwing', async () => {
      vi.mocked(petVetService.getPetVets).mockRejectedValue(
        new Error('forbidden')
      );

      await usePetVetsStore.getState().fetchPetVets('user-1', 'pet-1');

      expect(usePetVetsStore.getState().byPetId['pet-1']).toEqual({
        links: [],
        loading: false,
        error: 'forbidden',
      });
    });
  });

  describe('refreshPetVets', () => {
    it('refetches even after a successful fetch', async () => {
      vi.mocked(petVetService.getPetVets).mockResolvedValue([]);

      await usePetVetsStore.getState().fetchPetVets('user-1', 'pet-1');
      await usePetVetsStore.getState().refreshPetVets('user-1', 'pet-1');

      expect(petVetService.getPetVets).toHaveBeenCalledTimes(2);
    });
  });

  describe('linkVet', () => {
    it('appends the new link to the keyed cache', async () => {
      usePetVetsStore.setState({
        byPetId: {
          'pet-1': { links: [], loading: false, error: null },
        },
      });
      const link = mkLink('l1', 'v1', 'primary');
      const vet = mkVet('v1', 'Dr. A');
      vi.mocked(petVetService.linkVetToPet).mockResolvedValue(link);

      await usePetVetsStore
        .getState()
        .linkVet('user-1', 'pet-1', 'v1', vet, 'other');

      expect(usePetVetsStore.getState().byPetId['pet-1'].links).toEqual([
        { link, vet },
      ]);
    });
  });

  describe('unlinkVet', () => {
    it('removes the link by id', async () => {
      const link = mkLink('l1', 'v1', 'primary');
      const vet = mkVet('v1', 'Dr. A');
      usePetVetsStore.setState({
        byPetId: {
          'pet-1': { links: [{ link, vet }], loading: false, error: null },
        },
      });
      vi.mocked(petVetService.unlinkVetFromPet).mockResolvedValue(undefined);

      await usePetVetsStore.getState().unlinkVet('user-1', 'pet-1', 'l1');

      expect(petVetService.unlinkVetFromPet).toHaveBeenCalledWith(
        'user-1',
        'l1'
      );
      expect(usePetVetsStore.getState().byPetId['pet-1'].links).toEqual([]);
    });
  });

  describe('setPrimaryVet', () => {
    it('promotes target and demotes the current primary optimistically', async () => {
      const oldPrimary = mkLink('l1', 'v1', 'primary');
      const target = mkLink('l2', 'v2', 'specialist');
      // demoted primary should fall back to its previousNonPrimaryRole if set
      (
        oldPrimary as unknown as { previousNonPrimaryRole: string }
      ).previousNonPrimaryRole = 'specialist';

      usePetVetsStore.setState({
        byPetId: {
          'pet-1': {
            links: [
              { link: oldPrimary, vet: mkVet('v1', 'A') },
              { link: target, vet: mkVet('v2', 'B') },
            ],
            loading: false,
            error: null,
          },
        },
      });
      vi.mocked(petVetService.setPrimaryVet).mockResolvedValue(undefined);

      await usePetVetsStore.getState().setPrimaryVet('user-1', 'pet-1', 'l2');

      const updated = usePetVetsStore.getState().byPetId['pet-1'].links;
      expect(updated.find((l) => l.link.id === 'l2')?.link.role).toBe(
        'primary'
      );
      expect(updated.find((l) => l.link.id === 'l1')?.link.role).toBe(
        'specialist'
      );
    });

    it('refreshes from truth when service throws', async () => {
      usePetVetsStore.setState({
        byPetId: {
          'pet-1': {
            links: [
              { link: mkLink('l1', 'v1', 'other'), vet: mkVet('v1', 'A') },
            ],
            loading: false,
            error: null,
          },
        },
      });
      vi.mocked(petVetService.setPrimaryVet).mockRejectedValue(
        new Error('boom')
      );
      vi.mocked(petVetService.getPetVets).mockResolvedValue([]);

      await expect(
        usePetVetsStore.getState().setPrimaryVet('user-1', 'pet-1', 'l1')
      ).rejects.toThrow('boom');

      expect(petVetService.getPetVets).toHaveBeenCalledWith('user-1', 'pet-1');
    });
  });

  describe('updateLinkRole', () => {
    it('updates the role optimistically', async () => {
      usePetVetsStore.setState({
        byPetId: {
          'pet-1': {
            links: [
              { link: mkLink('l1', 'v1', 'other'), vet: mkVet('v1', 'A') },
            ],
            loading: false,
            error: null,
          },
        },
      });
      vi.mocked(petVetService.updateLink).mockResolvedValue(undefined);

      await usePetVetsStore
        .getState()
        .updateLinkRole('user-1', 'pet-1', 'l1', 'specialist');

      expect(
        usePetVetsStore.getState().byPetId['pet-1'].links[0].link.role
      ).toBe('specialist');
    });
  });
});

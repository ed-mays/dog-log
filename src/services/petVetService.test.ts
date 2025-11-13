/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PetVetService } from './petVetService';
import { PetVetRepository } from '@repositories/petVetRepository';
import { VetRepository } from '@repositories/vetRepository';
import type { PetVetLink, Vet } from '@models/vets';

vi.mock('@repositories/petVetRepository');
vi.mock('@repositories/vetRepository');

describe('PetVetService', () => {
  const userId = 'user-1';
  let service: PetVetService;

  // PetVetRepository mocks
  let mockListLinksByPet: ReturnType<typeof vi.fn>;
  let mockUpsertLink: ReturnType<typeof vi.fn>;
  let mockDeleteLink: ReturnType<typeof vi.fn>;
  let mockSetPrimaryForPet: ReturnType<typeof vi.fn>;

  // VetRepository mocks
  let mockGetVetById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockListLinksByPet = vi.fn();
    mockUpsertLink = vi.fn();
    mockDeleteLink = vi.fn();
    mockSetPrimaryForPet = vi.fn();

    mockGetVetById = vi.fn();

    (
      PetVetRepository as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(() => ({
      listLinksByPet: mockListLinksByPet,
      upsertLink: mockUpsertLink,
      deleteLink: mockDeleteLink,
      setPrimaryForPet: mockSetPrimaryForPet,
    }));

    (VetRepository as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({
        getById: mockGetVetById,
      })
    );

    service = new PetVetService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getPetVets joins links with existing vets only', async () => {
    const petId = 'pet-1';
    const links: PetVetLink[] = [
      {
        id: 'l1',
        petId,
        vetId: 'v1',
        role: 'primary',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      } as unknown as PetVetLink,
      {
        id: 'l2',
        petId,
        vetId: 'missing',
        role: 'other',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      } as unknown as PetVetLink,
    ];
    mockListLinksByPet.mockResolvedValue(links);
    const vet: Vet = {
      id: 'v1',
      ownerUserId: userId,
      name: 'Dr. A',
      phone: '+15550000000',
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      createdBy: userId,
      _normName: 'dr. a',
      _e164Phone: '+15550000000',
    } as unknown as Vet;
    mockGetVetById.mockImplementation((id: string) =>
      id === 'v1' ? Promise.resolve(vet) : Promise.resolve(null)
    );

    const result = await service.getPetVets(userId, petId);
    expect(result).toHaveLength(1);
    expect(result[0].link.id).toBe('l1');
    expect(result[0].vet.id).toBe('v1');
  });

  it('linkVetToPet sets primary when first link and omits previousNonPrimaryRole', async () => {
    const petId = 'pet-1';
    mockListLinksByPet.mockResolvedValue([]);
    mockUpsertLink.mockResolvedValue({ id: 'l1' } as unknown as PetVetLink);

    const link = await service.linkVetToPet(userId, petId, 'v1');

    expect(PetVetRepository).toHaveBeenCalledWith(userId);
    expect(mockUpsertLink).toHaveBeenCalled();
    const input = mockUpsertLink.mock.calls[0][0];
    expect(input.role).toBe('primary');
    expect(input.previousNonPrimaryRole).toBeUndefined();
    expect(link).toBeDefined();
  });

  it('linkVetToPet uses provided non-primary role and preserves it as previousNonPrimaryRole', async () => {
    const petId = 'pet-1';
    mockListLinksByPet.mockResolvedValue([{ id: 'l0' }]);
    mockUpsertLink.mockResolvedValue({ id: 'l2' } as unknown as PetVetLink);

    await service.linkVetToPet(userId, petId, 'v2', 'specialist');

    const input = mockUpsertLink.mock.calls[0][0];
    expect(input.role).toBe('specialist');
    expect(input.previousNonPrimaryRole).toBe('specialist');
  });

  it('unlinkVetFromPet delegates to repository', async () => {
    await service.unlinkVetFromPet(userId, 'l9');
    expect(mockDeleteLink).toHaveBeenCalledWith('l9');
  });

  it('setPrimaryVet delegates to repository with petId and linkId', async () => {
    await service.setPrimaryVet(userId, 'pet-1', 'l1');
    expect(mockSetPrimaryForPet).toHaveBeenCalledWith('pet-1', 'l1');
  });
});

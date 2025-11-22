import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vetService } from '@services/vetService';
import { petVetService } from '@services/petVetService';
import { VetRepository } from '@repositories/vetRepository';
import { PetVetRepository } from '@repositories/petVetRepository';
import { track } from '@services/analytics/analytics';

// Mock repositories
vi.mock('@repositories/vetRepository');
vi.mock('@repositories/petVetRepository');

// Mock analytics
vi.mock('@services/analytics/analytics', () => ({
  track: vi.fn(),
}));

describe('Analytics Integration', () => {
  const userId = 'user1';
  const petId = 'pet1';
  const vetId = 'vet1';
  const linkId = 'link1';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default repository mocks
    (VetRepository as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({
        createVet: vi.fn().mockResolvedValue({ id: vetId }),
        updateVet: vi.fn().mockResolvedValue({ id: vetId }),
        listVets: vi.fn().mockResolvedValue([]),
      })
    );

    (
      PetVetRepository as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(() => ({
      upsertLink: vi.fn().mockResolvedValue({ id: linkId }),
      deleteLink: vi.fn().mockResolvedValue(undefined),
      setPrimaryForPet: vi.fn().mockResolvedValue(undefined),
      listLinksByPet: vi.fn().mockResolvedValue([]),
    }));
  });

  it('tracks vet_created event', async () => {
    await vetService.createVet(userId, userId, {
      name: 'Dr. Test',
      phone: '555-555-5555',
    });

    expect(track).toHaveBeenCalledWith('vet_created', { vetId });
  });

  it('tracks vet_updated event', async () => {
    await vetService.updateVet(userId, vetId, {
      name: 'Dr. Updated',
    });

    expect(track).toHaveBeenCalledWith('vet_updated', { vetId });
  });

  it('tracks vet_link_created event', async () => {
    await petVetService.linkVetToPet(userId, petId, vetId, 'primary');

    expect(track).toHaveBeenCalledWith('vet_link_created', {
      petId,
      vetId,
      role: 'primary',
    });
  });

  it('tracks vet_link_deleted event', async () => {
    await petVetService.unlinkVetFromPet(userId, linkId);

    expect(track).toHaveBeenCalledWith('vet_link_deleted', { linkId });
  });

  it('tracks vet_primary_set event', async () => {
    await petVetService.setPrimaryVet(userId, petId, linkId);

    expect(track).toHaveBeenCalledWith('vet_primary_set', { petId, linkId });
  });

  it('tracks vet_search event', async () => {
    await vetService.searchVets(userId, 'search term');

    expect(track).toHaveBeenCalledWith('vet_search', { termLength: 11 });
  });
});

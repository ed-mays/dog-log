import { PetVetRepository } from '@repositories/petVetRepository';
import { VetRepository } from '@repositories/vetRepository';
import type { PetVetLink, Vet, VetId, PetVetRole } from '@models/vets';

export class PetVetService {
  async getPetVets(
    userId: string,
    petId: string
  ): Promise<Array<{ link: PetVetLink; vet: Vet }>> {
    const linkRepo = new PetVetRepository(userId);
    const vetRepo = new VetRepository(userId);
    const links = await linkRepo.listLinksByPet(petId);
    const results: Array<{ link: PetVetLink; vet: Vet }> = [];
    for (const link of links) {
      const vet = await vetRepo.getById(link.vetId);
      if (vet) results.push({ link, vet });
    }
    return results;
  }

  async linkVetToPet(
    userId: string,
    petId: string,
    vetId: VetId,
    role: PetVetRole = 'other',
    notes?: string
  ): Promise<PetVetLink> {
    const linkRepo = new PetVetRepository(userId);
    const existing = await linkRepo.listLinksByPet(petId);
    const isFirst = existing.length === 0;
    const effectiveRole: PetVetRole = isFirst ? 'primary' : (role ?? 'other');
    const previousNonPrimaryRole =
      !isFirst && effectiveRole !== 'primary' ? effectiveRole : null;

    // Build the link object, only including optional fields if they have values
    // Firestore rejects undefined values, so we must omit fields rather than set to undefined
    const linkData: {
      petId: string;
      vetId: VetId;
      role: PetVetRole;
      createdBy: string;
      notes?: string;
      previousNonPrimaryRole?: Exclude<PetVetRole, 'primary'>;
    } = {
      petId,
      vetId,
      role: effectiveRole,
      createdBy: userId,
    };

    if (notes) linkData.notes = notes;
    // TypeScript can't infer that previousNonPrimaryRole is never 'primary' due to the guard check
    // so we cast it to the correct type
    if (previousNonPrimaryRole) {
      linkData.previousNonPrimaryRole = previousNonPrimaryRole as Exclude<
        PetVetRole,
        'primary'
      >;
    }

    return linkRepo.upsertLink(linkData);
  }

  async unlinkVetFromPet(userId: string, linkId: string): Promise<void> {
    const linkRepo = new PetVetRepository(userId);
    await linkRepo.deleteLink(linkId);
  }

  async setPrimaryVet(
    userId: string,
    petId: string,
    linkId: string
  ): Promise<void> {
    const linkRepo = new PetVetRepository(userId);
    await linkRepo.setPrimaryForPet(petId, linkId);
  }
}

export const petVetService = new PetVetService();

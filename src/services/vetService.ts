import { VetRepository } from '@repositories/vetRepository';
import type { Vet, VetId } from '@models/vets';
import { normalizeName, normalizePhone } from '@utils/phone';

export type CreateVetInput = {
  name: string;
  phone: string;
  email?: string;
  website?: string;
  clinicName?: string;
  address?: Vet['address'];
  specialties?: string[];
  notes?: string;
};

export type UpdateVetInput = Partial<CreateVetInput> & {
  archived?: boolean;
};

export class VetService {
  async searchVets(userId: string, term: string): Promise<Vet[]> {
    const repo = new VetRepository(userId);
    const list = await repo.listVets();
    const q = term.trim().toLowerCase();
    // telemetry
    try {
      const { track } = await import('@services/analytics/analytics');
      track('vet_search', { termLength: term.length });
    } catch {
      // Swallow analytics errors; non-critical side effect
    }
    if (!q) return list;
    return list.filter((v) => {
      const hay = [v.name, v.clinicName, ...(v.specialties ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  async getVet(userId: string, id: VetId): Promise<Vet | null> {
    const repo = new VetRepository(userId);
    return repo.getById(id);
  }

  async createVet(
    userId: string,
    ownerUserId: string,
    input: CreateVetInput
  ): Promise<Vet> {
    // normalize fields for uniqueness/search
    const _normName = normalizeName(input.name);
    const _e164Phone = normalizePhone(input.phone);
    const repo = new VetRepository(userId);
    const created = await repo.createVet({
      ownerUserId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email,
      website: input.website,
      clinicName: input.clinicName,
      address: input.address,
      specialties: input.specialties,
      notes: input.notes,
      createdBy: ownerUserId,
      _normName,
      _e164Phone,
    } as unknown as Omit<Vet, 'id' | 'createdAt' | 'updatedAt'>);
    return created;
  }

  async updateVet(
    userId: string,
    id: VetId,
    patch: UpdateVetInput
  ): Promise<Vet> {
    const repo = new VetRepository(userId);
    const updates: Partial<Vet> = { ...patch } as Partial<Vet>;
    if (patch.name !== undefined) updates._normName = normalizeName(patch.name);
    if (patch.phone !== undefined)
      updates._e164Phone = normalizePhone(patch.phone);
    return repo.updateVet(id, updates as Partial<Omit<Vet, 'id'>>);
  }

  async archiveVet(userId: string, id: VetId): Promise<Vet> {
    const repo = new VetRepository(userId);
    return repo.archive(id);
  }
}

export const vetService = new VetService();

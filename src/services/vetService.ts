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
    const trimmedName = input.name.trim();
    const trimmedPhone = input.phone.trim();

    if (!trimmedName) {
      throw new Error('Name is required');
    }
    if (!trimmedPhone) {
      throw new Error('Phone is required');
    }

    // normalize fields for uniqueness/search
    const _normName = normalizeName(trimmedName);
    const _e164Phone = normalizePhone(trimmedPhone);
    const repo = new VetRepository(userId);
    const vet = await repo.createVet({
      ownerUserId,
      name: trimmedName,
      phone: trimmedPhone,
      email: input.email?.trim() || null,
      website: input.website?.trim() || null,
      clinicName: input.clinicName?.trim() || null,
      address: input.address || null,
      specialties: input.specialties || null,
      notes: input.notes?.trim() || null,
      createdBy: ownerUserId,
      _normName,
      _e164Phone,
    } as unknown as Omit<Vet, 'id' | 'createdAt' | 'updatedAt'>);

    try {
      const { track } = await import('@services/analytics/analytics');
      track('vet_created', { vetId: vet.id });
    } catch {
      // ignore
    }
    return vet;
  }

  async updateVet(
    userId: string,
    id: VetId,
    patch: UpdateVetInput
  ): Promise<Vet> {
    const repo = new VetRepository(userId);
    const updates: Partial<Vet> = { ...patch } as Partial<Vet>;

    if (patch.name !== undefined) {
      const trimmedName = patch.name.trim();
      if (!trimmedName) throw new Error('Name cannot be empty');
      updates.name = trimmedName;
      updates._normName = normalizeName(trimmedName);
    }

    if (patch.phone !== undefined) {
      const trimmedPhone = patch.phone.trim();
      if (!trimmedPhone) throw new Error('Phone cannot be empty');
      updates.phone = trimmedPhone;
      updates._e164Phone = normalizePhone(trimmedPhone);
    }

    if (patch.email !== undefined) {
      updates.email = patch.email?.trim() || undefined;
    }
    if (patch.website !== undefined) {
      updates.website = patch.website?.trim() || undefined;
    }
    if (patch.clinicName !== undefined) {
      updates.clinicName = patch.clinicName?.trim() || undefined;
    }
    if (patch.notes !== undefined) {
      updates.notes = patch.notes?.trim() || undefined;
    }

    const vet = await repo.updateVet(id, updates as Partial<Omit<Vet, 'id'>>);
    try {
      const { track } = await import('@services/analytics/analytics');
      track('vet_updated', { vetId: id });
    } catch {
      // ignore
    }
    return vet;
  }

  async archiveVet(userId: string, id: VetId): Promise<Vet> {
    const repo = new VetRepository(userId);
    return repo.archive(id);
  }
}

export const vetService = new VetService();

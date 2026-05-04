import { IncidentRepository } from '@repositories/IncidentRepository';
import type {
  Incident,
  Severity,
  IncidentTypeId,
  ChipId,
} from '@features/incidents/types';

// Per spec BR-2 (timer at moment of gesture), BR-13 (STOP), BR-26 (singleton)
// and design §D2 / §D8: the activation path is no-await — the caller (store)
// generates the UUID synchronously and passes it here so the timer can start
// before this write resolves. BR-29's "petId never cleared" invariant is
// enforced at runtime here (the type permits petId?: string but a malformed
// '' or null cast must be rejected).

export interface CreateIncidentArgs {
  id: string;
  userId: string;
  petId: string;
  startedAt: Date;
}

export interface StopIncidentArgs {
  userId: string;
  incidentId: string;
  endedAt: Date;
}

export interface AppendJournalArgs {
  userId: string;
  incidentId: string;
  text: string;
  now?: Date; // injectable for deterministic testing
}

export class IncidentService {
  async createIncident(args: CreateIncidentArgs): Promise<Incident> {
    if (!args.petId || args.petId.trim() === '') {
      throw new Error('createIncident: petId is required (BR-29)');
    }
    const repo = new IncidentRepository(args.userId);
    return repo.createIncidentWithId(args.id, {
      userId: args.userId,
      petId: args.petId,
      startedAt: args.startedAt,
      createdBy: args.userId,
    });
  }

  async stopIncident(args: StopIncidentArgs): Promise<Incident> {
    const repo = new IncidentRepository(args.userId);
    return repo.update(args.incidentId, { endedAt: args.endedAt });
  }

  async findActiveIncident(userId: string): Promise<Incident | null> {
    const repo = new IncidentRepository(userId);
    return repo.findActiveForUser();
  }

  async getIncident(
    userId: string,
    incidentId: string
  ): Promise<Incident | null> {
    const repo = new IncidentRepository(userId);
    return repo.getById(incidentId);
  }

  async setSeverity(
    userId: string,
    incidentId: string,
    severity: Severity
  ): Promise<Incident> {
    const repo = new IncidentRepository(userId);
    return repo.update(incidentId, { severity });
  }

  async clearSeverity(userId: string, incidentId: string): Promise<Incident> {
    const repo = new IncidentRepository(userId);
    return repo.update(incidentId, { severity: null });
  }

  async toggleChip(
    userId: string,
    incidentId: string,
    chipId: ChipId
  ): Promise<Incident> {
    const repo = new IncidentRepository(userId);
    return repo.toggleChip(incidentId, chipId);
  }

  async appendJournal(args: AppendJournalArgs): Promise<Incident> {
    const repo = new IncidentRepository(args.userId);
    const incident = await repo.getById(args.incidentId);
    if (!incident) {
      throw new Error(`appendJournal: incident ${args.incidentId} not found`);
    }
    const now = args.now ?? new Date();
    const elapsedSeconds = Math.floor(
      (now.getTime() - incident.startedAt.getTime()) / 1000
    );
    return repo.appendJournal(args.incidentId, {
      elapsedSeconds,
      text: args.text,
      addedAt: now,
    });
  }

  async setType(
    userId: string,
    incidentId: string,
    type: IncidentTypeId
  ): Promise<Incident> {
    const repo = new IncidentRepository(userId);
    return repo.update(incidentId, { type });
  }

  async clearType(userId: string, incidentId: string): Promise<Incident> {
    const repo = new IncidentRepository(userId);
    return repo.update(incidentId, { type: null });
  }

  // BR-23: per-pet chronological list, most recent first.
  // Soft-delete exclusion is enforced by IncidentRepository.findByPetId at the
  // query layer — callers receive only live records.
  async listForPet(userId: string, petId: string): Promise<Incident[]> {
    const repo = new IncidentRepository(userId);
    return repo.findByPetId(petId);
  }
}

export const incidentService = new IncidentService();

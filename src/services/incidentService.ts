import { IncidentRepository } from '@repositories/IncidentRepository';
import type { Incident } from '@features/incidents/types';

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
}

export const incidentService = new IncidentService();

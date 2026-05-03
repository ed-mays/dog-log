import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IncidentRepository before importing the service so the singleton
// inside incidentService picks up the mocked methods.
const mockCreateIncidentWithId = vi.fn();
const mockUpdate = vi.fn();
const mockFindActiveForUser = vi.fn();
const mockGetById = vi.fn();

vi.mock('@repositories/IncidentRepository', () => ({
  IncidentRepository: vi.fn().mockImplementation(() => ({
    createIncidentWithId: mockCreateIncidentWithId,
    update: mockUpdate,
    findActiveForUser: mockFindActiveForUser,
    getById: mockGetById,
  })),
}));

import { incidentService } from './incidentService';

const userId = 'user-1';

describe('incidentService.createIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a fully-formed Incident with the synchronously-supplied startedAt', async () => {
    const startedAt = new Date('2026-05-02T10:00:00.000Z');
    mockCreateIncidentWithId.mockImplementation((id, fields) =>
      Promise.resolve({
        id,
        ...fields,
        endedAt: null,
        type: null,
        severity: null,
        chips: [],
        journal: [],
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const result = await incidentService.createIncident({
      id: 'client-uuid',
      userId,
      petId: 'pet-1',
      startedAt,
    });

    expect(mockCreateIncidentWithId).toHaveBeenCalledWith('client-uuid', {
      userId,
      petId: 'pet-1',
      startedAt,
      createdBy: userId,
    });
    expect(result).toMatchObject({
      id: 'client-uuid',
      petId: 'pet-1',
      startedAt,
      endedAt: null,
    });
  });

  it('rejects an empty petId per BR-29 (petId required at all times)', async () => {
    await expect(
      incidentService.createIncident({
        id: 'client-uuid',
        userId,
        petId: '',
        startedAt: new Date(),
      })
    ).rejects.toThrow(/petId/);
    expect(mockCreateIncidentWithId).not.toHaveBeenCalled();
  });
});

describe('incidentService.stopIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets endedAt on the incident via repository.update', async () => {
    const endedAt = new Date('2026-05-02T10:30:00.000Z');
    mockUpdate.mockResolvedValue({ id: 'incident-1', endedAt });

    const result = await incidentService.stopIncident({
      userId,
      incidentId: 'incident-1',
      endedAt,
    });

    expect(mockUpdate).toHaveBeenCalledWith('incident-1', { endedAt });
    expect(result.endedAt).toEqual(endedAt);
  });
});

describe('incidentService.findActiveIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the single active incident when one exists', async () => {
    const startedAt = new Date('2026-05-02T10:00:00.000Z');
    mockFindActiveForUser.mockResolvedValue({
      id: 'active-1',
      petId: 'pet-1',
      startedAt,
      endedAt: null,
    });

    const result = await incidentService.findActiveIncident(userId);
    expect(result).toMatchObject({ id: 'active-1', endedAt: null });
  });

  it('returns null when no active incident exists', async () => {
    mockFindActiveForUser.mockResolvedValue(null);
    const result = await incidentService.findActiveIncident(userId);
    expect(result).toBeNull();
  });
});

describe('incidentService.getIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes through to repository.getById and returns the incident', async () => {
    const startedAt = new Date('2026-05-02T10:00:00.000Z');
    mockGetById.mockResolvedValue({
      id: 'incident-2',
      userId,
      petId: 'pet-1',
      startedAt,
      endedAt: null,
    });
    const result = await incidentService.getIncident(userId, 'incident-2');
    expect(mockGetById).toHaveBeenCalledWith('incident-2');
    expect(result).toMatchObject({ id: 'incident-2' });
  });

  it('returns null when the repository finds no incident', async () => {
    mockGetById.mockResolvedValue(null);
    const result = await incidentService.getIncident(userId, 'missing');
    expect(result).toBeNull();
  });
});

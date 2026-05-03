import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IncidentRepository before importing the service so the singleton
// inside incidentService picks up the mocked methods.
const mockCreateIncidentWithId = vi.fn();
const mockUpdate = vi.fn();
const mockFindActiveForUser = vi.fn();
const mockGetById = vi.fn();
const mockAppendJournal = vi.fn();
const mockToggleChip = vi.fn();

vi.mock('@repositories/IncidentRepository', () => ({
  IncidentRepository: vi.fn().mockImplementation(() => ({
    createIncidentWithId: mockCreateIncidentWithId,
    update: mockUpdate,
    findActiveForUser: mockFindActiveForUser,
    getById: mockGetById,
    appendJournal: mockAppendJournal,
    toggleChip: mockToggleChip,
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

describe('incidentService.setSeverity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets severity via repository.update', async () => {
    const updated = {
      id: 'incident-1',
      userId,
      petId: 'pet-1',
      startedAt: new Date(),
      endedAt: null,
      type: null,
      severity: 'moderate' as const,
      chips: [],
      journal: [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
    mockUpdate.mockResolvedValue(updated);

    const result = await incidentService.setSeverity(
      userId,
      'incident-1',
      'moderate'
    );

    expect(mockUpdate).toHaveBeenCalledWith('incident-1', {
      severity: 'moderate',
    });
    expect(result.severity).toBe('moderate');
  });
});

describe('incidentService.clearSeverity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears severity by setting it to null via repository.update', async () => {
    const updated = {
      id: 'incident-1',
      userId,
      petId: 'pet-1',
      startedAt: new Date(),
      endedAt: null,
      type: null,
      severity: null,
      chips: [],
      journal: [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
    mockUpdate.mockResolvedValue(updated);

    const result = await incidentService.clearSeverity(userId, 'incident-1');

    expect(mockUpdate).toHaveBeenCalledWith('incident-1', { severity: null });
    expect(result.severity).toBeNull();
  });
});

describe('incidentService.toggleChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to repository.toggleChip', async () => {
    const updated = {
      id: 'incident-1',
      userId,
      petId: 'pet-1',
      startedAt: new Date(),
      endedAt: null,
      type: null,
      severity: null,
      chips: ['stiff'],
      journal: [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
    mockToggleChip.mockResolvedValue(updated);

    const result = await incidentService.toggleChip(
      userId,
      'incident-1',
      'stiff'
    );

    expect(mockToggleChip).toHaveBeenCalledWith('incident-1', 'stiff');
    expect(result.chips).toEqual(['stiff']);
  });

  it('throws when incident not found', async () => {
    mockToggleChip.mockRejectedValue(
      new Error('Incident incident-1 not found')
    );

    await expect(
      incidentService.toggleChip(userId, 'incident-1', 'stiff')
    ).rejects.toThrow(/not found/);
  });
});

describe('incidentService.appendJournal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes elapsedSeconds against incident.startedAt at call time (BR-31)', async () => {
    const startedAt = new Date('2026-05-02T10:00:00.000Z');
    const now = new Date('2026-05-02T10:02:15.000Z'); // 135 seconds later
    const incident = {
      id: 'incident-1',
      userId,
      petId: 'pet-1',
      startedAt,
      endedAt: null,
      type: null,
      severity: null,
      chips: [],
      journal: [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
    mockGetById.mockResolvedValue(incident);
    mockAppendJournal.mockResolvedValue({
      ...incident,
      journal: [{ elapsedSeconds: 135, text: 'Still seizing', addedAt: now }],
    });

    const result = await incidentService.appendJournal({
      userId,
      incidentId: 'incident-1',
      text: 'Still seizing',
      now, // injectable for deterministic test
    });

    expect(mockGetById).toHaveBeenCalledWith('incident-1');
    expect(mockAppendJournal).toHaveBeenCalledWith('incident-1', {
      elapsedSeconds: 135,
      text: 'Still seizing',
      addedAt: now,
    });
    expect(result.journal[0].elapsedSeconds).toBe(135);
  });

  it('throws when incident not found and does not call appendJournal', async () => {
    mockGetById.mockResolvedValue(null);

    await expect(
      incidentService.appendJournal({
        userId,
        incidentId: 'missing',
        text: 'test',
      })
    ).rejects.toThrow(/not found/);

    expect(mockAppendJournal).not.toHaveBeenCalled();
  });
});

describe('incidentService.setType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets type via repository.update', async () => {
    const updated = {
      id: 'incident-1',
      userId,
      petId: 'pet-1',
      startedAt: new Date(),
      endedAt: null,
      type: 'seizure' as const,
      severity: null,
      chips: [],
      journal: [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
    mockUpdate.mockResolvedValue(updated);

    const result = await incidentService.setType(
      userId,
      'incident-1',
      'seizure'
    );

    expect(mockUpdate).toHaveBeenCalledWith('incident-1', { type: 'seizure' });
    expect(result.type).toBe('seizure');
  });

  it('does NOT modify other fields per BR-22', async () => {
    const existingSeverity = 'moderate' as const;
    const existingChips = ['stiff', 'drooling'];
    const existingJournal = [
      { elapsedSeconds: 10, text: 'Started', addedAt: new Date() },
    ];

    const updated = {
      id: 'incident-1',
      userId,
      petId: 'pet-1',
      startedAt: new Date(),
      endedAt: null,
      type: 'injury' as const,
      severity: existingSeverity,
      chips: existingChips,
      journal: existingJournal,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
    mockUpdate.mockResolvedValue(updated);

    const result = await incidentService.setType(
      userId,
      'incident-1',
      'injury'
    );

    expect(result.severity).toBe(existingSeverity);
    expect(result.chips).toEqual(existingChips);
    expect(result.journal).toEqual(existingJournal);
  });
});

describe('incidentService.clearType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears type by setting it to null via repository.update', async () => {
    const updated = {
      id: 'incident-1',
      userId,
      petId: 'pet-1',
      startedAt: new Date(),
      endedAt: null,
      type: null,
      severity: null,
      chips: [],
      journal: [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
    mockUpdate.mockResolvedValue(updated);

    const result = await incidentService.clearType(userId, 'incident-1');

    expect(mockUpdate).toHaveBeenCalledWith('incident-1', { type: null });
    expect(result.type).toBeNull();
  });
});

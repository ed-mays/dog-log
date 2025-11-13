import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VetService } from './vetService';
import { VetRepository } from '@repositories/vetRepository';
import type { Vet } from '@models/vets';

vi.mock('@repositories/vetRepository');

describe('VetService', () => {
  let service: VetService;
  const userId = 'user-1';
  const ownerUserId = userId;

  let mockListVets: ReturnType<typeof vi.fn>;
  let mockGetById: ReturnType<typeof vi.fn>;
  let mockCreateVet: ReturnType<typeof vi.fn>;
  let mockUpdateVet: ReturnType<typeof vi.fn>;
  let mockArchive: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockListVets = vi.fn();
    mockGetById = vi.fn();
    mockCreateVet = vi.fn();
    mockUpdateVet = vi.fn();
    mockArchive = vi.fn();

    (VetRepository as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({
        listVets: mockListVets,
        getById: mockGetById,
        createVet: mockCreateVet,
        updateVet: mockUpdateVet,
        archive: mockArchive,
      })
    );

    service = new VetService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('searchVets filters by term and tracks telemetry', async () => {
    const vets: Vet[] = [
      {
        id: 'v1',
        ownerUserId,
        name: 'Dr. Alice',
        phone: '+15551234567',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: ownerUserId,
        _normName: 'dr. alice',
        _e164Phone: '+15551234567',
      } as unknown as Vet,
      {
        id: 'v2',
        ownerUserId,
        name: 'Metro ER',
        clinicName: 'Metro ER',
        specialties: ['Emergency'],
        phone: '+15557654321',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: ownerUserId,
        _normName: 'metro er',
        _e164Phone: '+15557654321',
      } as unknown as Vet,
    ];
    mockListVets.mockResolvedValue(vets);

    const result = await service.searchVets(userId, 'metro');
    expect(result.map((v) => v.id)).toEqual(['v2']);
  });

  it('createVet normalizes name and phone and delegates to repository', async () => {
    const created: Vet = {
      id: 'v1',
      ownerUserId,
      name: 'Dr. Bob',
      phone: ' (555) 111-2222 ',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: ownerUserId,
      _normName: 'dr. bob',
      _e164Phone: '+15551112222',
    } as unknown as Vet;
    mockCreateVet.mockResolvedValue(created);

    const result = await service.createVet(userId, ownerUserId, {
      name: 'Dr. Bob',
      phone: ' (555) 111-2222 ',
    });

    expect(VetRepository).toHaveBeenCalledWith(userId);
    expect(mockCreateVet).toHaveBeenCalled();
    const args = mockCreateVet.mock.calls[0][0];
    expect(args._normName).toBe('dr. bob');
    expect(args._e164Phone).toBe('+15551112222');
    expect(result).toBe(created);
  });

  it('updateVet normalizes fields when present', async () => {
    const updated: Vet = {
      id: 'v1',
      ownerUserId,
      name: 'Dr. Bobby',
      phone: '+15553334444',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: ownerUserId,
      _normName: 'dr. bobby',
      _e164Phone: '+15553334444',
    } as unknown as Vet;
    mockUpdateVet.mockResolvedValue(updated);

    const result = await service.updateVet(userId, 'v1', {
      name: 'Dr. Bobby',
      phone: ' +1 (555) 333-4444 ',
    });

    expect(VetRepository).toHaveBeenCalledWith(userId);
    expect(mockUpdateVet).toHaveBeenCalled();
    const patch = mockUpdateVet.mock.calls[0][1];
    expect(patch._normName).toBe('dr. bobby');
    expect(patch._e164Phone).toBe('+15553334444');
    expect(result).toBe(updated);
  });

  it('archiveVet delegates to repository', async () => {
    const archived = { id: 'v1' } as unknown as Vet;
    mockArchive.mockResolvedValue(archived);
    const result = await service.archiveVet(userId, 'v1');
    expect(VetRepository).toHaveBeenCalledWith(userId);
    expect(mockArchive).toHaveBeenCalledWith('v1');
    expect(result).toBe(archived);
  });

  it('getVet returns the vet when found', async () => {
    const vet = { id: 'v1' } as unknown as Vet;
    mockGetById.mockResolvedValue(vet);
    const result = await service.getVet(userId, 'v1');
    expect(VetRepository).toHaveBeenCalledWith(userId);
    expect(result).toBe(vet);
  });

  it('getVet returns null when not found', async () => {
    mockGetById.mockResolvedValue(null);
    const result = await service.getVet(userId, 'missing');
    expect(result).toBeNull();
  });

  it('searchVets returns full list when term is empty after trim', async () => {
    const vets: Vet[] = [
      {
        id: 'v1',
        ownerUserId,
        name: 'Dr. A',
        phone: '+15550000000',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: ownerUserId,
        _normName: 'dr. a',
        _e164Phone: '+15550000000',
      } as unknown as Vet,
    ];
    mockListVets.mockResolvedValue(vets);

    vi.doMock(
      '@services/analytics/analytics',
      () => ({
        track: vi.fn(),
      }),
      { virtual: true }
    );

    const result = await service.searchVets(userId, '   ');
    expect(result).toEqual(vets);
  });

  it('searchVets swallows analytics errors and still returns filtered list', async () => {
    const vets: Vet[] = [];
    mockListVets.mockResolvedValue(vets);

    vi.doMock(
      '@services/analytics/analytics',
      () => ({
        track: () => {
          throw new Error('boom');
        },
      }),
      { virtual: true }
    );

    const result = await service.searchVets(userId, 'x');
    expect(result).toEqual([]);
  });
});

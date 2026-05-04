import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { Incident } from '@features/incidents/types';

// Factories use vi.fn() inline — avoids TDZ issues with hoisted vi.mock calls.
vi.mock('@services/incidentService', () => ({
  incidentService: {
    listForPet: vi.fn(),
  },
}));

vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(
    (selector: (s: { user: { uid: string } | null }) => unknown) =>
      selector({ user: { uid: 'user-1' } })
  ),
}));

import { useIncidentHistory } from './useIncidentHistory';
import { incidentService } from '@services/incidentService';
import { useAuthStore } from '@store/auth.store';

const userId = 'user-1';
const mockListForPet = incidentService.listForPet as Mock;
const mockUseAuthStore = useAuthStore as Mock;

function fakeIncident(over: Partial<Incident> = {}): Incident {
  const startedAt = new Date('2026-05-02T10:00:00.000Z');
  return {
    id: 'incident-1',
    userId,
    createdBy: userId,
    petId: 'pet-1',
    startedAt,
    endedAt: null,
    type: null,
    severity: null,
    chips: [],
    journal: [],
    deletedAt: null,
    createdAt: startedAt,
    updatedAt: startedAt,
    ...over,
  };
}

describe('useIncidentHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: { uid: string } }) => unknown) =>
        selector({ user: { uid: userId } })
    );
  });

  it('returns loading=true initially then resolves (BR-23)', async () => {
    let resolve: (v: Incident[]) => void;
    mockListForPet.mockReturnValue(
      new Promise<Incident[]>((r) => {
        resolve = r;
      })
    );

    const { result } = renderHook(() => useIncidentHistory('pet-1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.incidents).toEqual([]);

    resolve!([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('Given pet has incidents, returns them in service order (BR-23)', async () => {
    const incidents = [
      fakeIncident({ id: 'i-2' }),
      fakeIncident({ id: 'i-1' }),
    ];
    mockListForPet.mockResolvedValue(incidents);

    const { result } = renderHook(() => useIncidentHistory('pet-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockListForPet).toHaveBeenCalledWith(userId, 'pet-1');
    expect(result.current.incidents).toHaveLength(2);
    expect(result.current.incidents[0].id).toBe('i-2');
    expect(result.current.error).toBeNull();
  });

  it('Given no incidents, returns empty array', async () => {
    mockListForPet.mockResolvedValue([]);

    const { result } = renderHook(() => useIncidentHistory('pet-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.incidents).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('Given service error, surfaces error string and empty incidents', async () => {
    mockListForPet.mockRejectedValue(new Error('Firestore read failed'));

    const { result } = renderHook(() => useIncidentHistory('pet-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Firestore read failed');
    expect(result.current.incidents).toEqual([]);
  });

  it('Given no authenticated user, returns loading=false with empty list', async () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: null }) => unknown) => selector({ user: null })
    );

    const { result } = renderHook(() => useIncidentHistory('pet-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockListForPet).not.toHaveBeenCalled();
    expect(result.current.incidents).toEqual([]);
  });
});

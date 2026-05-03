import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSavedIncident } from './useSavedIncident';
import { useAuthStore } from '@store/auth.store';
import { incidentService } from '@services/incidentService';
import type { Incident } from '@features/incidents/types';

vi.mock('@store/auth.store');

vi.mock('@services/incidentService', () => ({
  incidentService: {
    getIncident: vi.fn(),
  },
}));

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  const now = new Date('2026-05-02T10:00:00.000Z');
  return {
    id: 'inc-1',
    userId: 'user-1',
    createdBy: 'user-1',
    petId: 'pet-1',
    startedAt: now,
    endedAt: new Date('2026-05-02T10:05:00.000Z'),
    type: null,
    severity: null,
    chips: [],
    journal: [],
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('useSavedIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector?.({ user: { uid: 'user-1' } })
    );
  });

  it('returns undefined (loading) initially', () => {
    vi.mocked(incidentService.getIncident).mockReturnValue(
      new Promise(() => {})
    );
    const { result } = renderHook(() => useSavedIncident('inc-1'));
    expect(result.current).toBeUndefined();
  });

  it('returns the incident when found', async () => {
    const incident = makeIncident();
    vi.mocked(incidentService.getIncident).mockResolvedValue(incident);
    const { result } = renderHook(() => useSavedIncident('inc-1'));
    await waitFor(() => expect(result.current).not.toBeUndefined());
    expect(result.current).toEqual(incident);
  });

  it('returns null when service returns null', async () => {
    vi.mocked(incidentService.getIncident).mockResolvedValue(null);
    const { result } = renderHook(() => useSavedIncident('inc-1'));
    await waitFor(() => expect(result.current).not.toBeUndefined());
    expect(result.current).toBeNull();
  });

  it('returns null when service throws', async () => {
    vi.mocked(incidentService.getIncident).mockRejectedValue(
      new Error('network error')
    );
    const { result } = renderHook(() => useSavedIncident('inc-1'));
    await waitFor(() => expect(result.current).not.toBeUndefined());
    expect(result.current).toBeNull();
  });

  it('returns null immediately when incidentId is undefined', () => {
    const { result } = renderHook(() => useSavedIncident(undefined));
    expect(result.current).toBeNull();
    expect(vi.mocked(incidentService.getIncident)).not.toHaveBeenCalled();
  });

  it('returns null immediately when user is not authenticated', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector?.({ user: null })
    );
    const { result } = renderHook(() => useSavedIncident('inc-1'));
    expect(result.current).toBeNull();
    expect(vi.mocked(incidentService.getIncident)).not.toHaveBeenCalled();
  });
});

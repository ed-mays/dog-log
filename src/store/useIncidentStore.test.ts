import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useIncidentStore } from './useIncidentStore';
import { incidentService } from '@services/incidentService';
import { useAuthStore } from '@store/auth.store';
import type { Incident } from '@features/incidents/types';

vi.mock('@services/incidentService', () => ({
  incidentService: {
    createIncident: vi.fn(),
    stopIncident: vi.fn(),
    findActiveIncident: vi.fn(),
    setSeverity: vi.fn(),
    clearSeverity: vi.fn(),
    appendJournal: vi.fn(),
  },
}));

vi.mock('@store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ user: { uid: 'user-1' } })),
  },
}));

const startedAt = new Date('2026-05-02T10:00:00.000Z');

function fakeActive(over: Partial<Incident> = {}): Incident {
  return {
    id: 'incident-1',
    userId: 'user-1',
    createdBy: 'user-1',
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

describe('useIncidentStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore.getState as Mock).mockReturnValue({
      user: { uid: 'user-1' },
    });
    useIncidentStore.setState({
      activeIncident: null,
      isLoading: false,
      error: null,
    });
  });

  describe('startIncident (BR-2 timer at moment of gesture)', () => {
    it('synchronously sets activeIncident BEFORE the persist promise resolves', async () => {
      let resolvePersist: (value: Incident) => void = () => undefined;
      vi.mocked(incidentService.createIncident).mockReturnValue(
        new Promise<Incident>((resolve) => {
          resolvePersist = resolve;
        })
      );

      const { result } = renderHook(() => useIncidentStore());

      // Fire start without awaiting; synchronous-state requirement means
      // activeIncident must be populated before the async persist resolves.
      let pending: Promise<void> | undefined;
      act(() => {
        pending = result.current.startIncident({ petId: 'pet-1' });
      });

      expect(result.current.activeIncident).not.toBeNull();
      expect(result.current.activeIncident?.petId).toBe('pet-1');
      expect(result.current.activeIncident?.endedAt).toBeNull();
      expect(result.current.activeIncident?.id).toBeTruthy();

      // Resolve the persist promise so the test cleans up.
      const id = result.current.activeIncident!.id;
      await act(async () => {
        resolvePersist(fakeActive({ id, petId: 'pet-1' }));
        await pending;
      });
    });

    it('passes the synchronously-generated id and startedAt through to the service', async () => {
      vi.mocked(incidentService.createIncident).mockImplementation(
        async (args) => fakeActive({ id: args.id, startedAt: args.startedAt })
      );

      const { result } = renderHook(() => useIncidentStore());

      await act(async () => {
        await result.current.startIncident({ petId: 'pet-1' });
      });

      const callArgs = vi.mocked(incidentService.createIncident).mock
        .calls[0]![0];
      expect(callArgs.id).toBeTruthy();
      expect(callArgs.userId).toBe('user-1');
      expect(callArgs.petId).toBe('pet-1');
      expect(callArgs.startedAt).toBeInstanceOf(Date);
    });

    it('does nothing when no user is authenticated', async () => {
      (useAuthStore.getState as Mock).mockReturnValue({ user: null });
      const { result } = renderHook(() => useIncidentStore());

      await act(async () => {
        await result.current.startIncident({ petId: 'pet-1' });
      });

      expect(result.current.activeIncident).toBeNull();
      expect(incidentService.createIncident).not.toHaveBeenCalled();
    });
  });

  describe('stopIncident (BR-13, BR-14)', () => {
    it('keeps activeIncident populated with endedAt set after STOP (§D2 post-STOP invariant)', async () => {
      const endedAt = new Date('2026-05-02T10:30:00.000Z');
      vi.mocked(incidentService.stopIncident).mockResolvedValue(
        fakeActive({ endedAt })
      );

      useIncidentStore.setState({ activeIncident: fakeActive() });
      const { result } = renderHook(() => useIncidentStore());

      await act(async () => {
        await result.current.stopIncident();
      });

      // §D2 post-STOP invariant (round-31 amend_design): activeIncident
      // remains populated with endedAt set, NOT nulled. This keeps the
      // surface open after STOP per BR-14 and unifies live + post-stop
      // phases per BR-25. The page's redirect now triggers only on
      // "no incident has ever been started this session", not on "STOP
      // just fired".
      expect(result.current.activeIncident).not.toBeNull();
      expect(result.current.activeIncident?.endedAt).toBeInstanceOf(Date);
      expect(result.current.activeIncident?.id).toBe('incident-1');
      expect(incidentService.stopIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          incidentId: 'incident-1',
          endedAt: expect.any(Date),
        })
      );
    });

    it('is a no-op when no active incident exists', async () => {
      const { result } = renderHook(() => useIncidentStore());

      await act(async () => {
        await result.current.stopIncident();
      });

      expect(incidentService.stopIncident).not.toHaveBeenCalled();
    });
  });

  describe('setSeverity / clearSeverity (BR-6)', () => {
    it('sets severity optimistically and persists via service', async () => {
      vi.mocked(incidentService.setSeverity).mockResolvedValue(
        fakeActive({ severity: 'moderate' })
      );
      useIncidentStore.setState({ activeIncident: fakeActive() });

      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.setSeverity('moderate');
      });

      expect(result.current.activeIncident?.severity).toBe('moderate');
      expect(incidentService.setSeverity).toHaveBeenCalledWith(
        'user-1',
        'incident-1',
        'moderate'
      );
    });

    it('no-ops clearSeverity when no active incident', async () => {
      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.clearSeverity();
      });
      expect(incidentService.clearSeverity).not.toHaveBeenCalled();
    });

    it('captures error on clearSeverity persist failure', async () => {
      vi.mocked(incidentService.clearSeverity).mockRejectedValue(
        new Error('clear-fail')
      );
      useIncidentStore.setState({ activeIncident: fakeActive() });
      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.clearSeverity();
      });
      expect(result.current.error).toBe('clear-fail');
    });

    it('no-ops setSeverity when no active incident', async () => {
      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.setSeverity('mild');
      });
      expect(incidentService.setSeverity).not.toHaveBeenCalled();
    });

    it('clears severity optimistically and persists via service', async () => {
      vi.mocked(incidentService.clearSeverity).mockResolvedValue(
        fakeActive({ severity: null })
      );
      useIncidentStore.setState({
        activeIncident: fakeActive({ severity: 'severe' }),
      });

      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.clearSeverity();
      });

      expect(result.current.activeIncident?.severity).toBeNull();
      expect(incidentService.clearSeverity).toHaveBeenCalledWith(
        'user-1',
        'incident-1'
      );
    });

    it('captures error on setSeverity persist failure', async () => {
      vi.mocked(incidentService.setSeverity).mockRejectedValue(
        new Error('boom')
      );
      useIncidentStore.setState({ activeIncident: fakeActive() });

      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.setSeverity('mild');
      });
      expect(result.current.error).toBe('boom');
    });
  });

  describe('hydrateActiveIncident (auth boot — feeds into T-29)', () => {
    it('populates activeIncident when the service returns one', async () => {
      vi.mocked(incidentService.findActiveIncident).mockResolvedValue(
        fakeActive()
      );

      const { result } = renderHook(() => useIncidentStore());

      await act(async () => {
        await result.current.hydrateActiveIncident();
      });

      expect(result.current.activeIncident).not.toBeNull();
      expect(result.current.activeIncident?.id).toBe('incident-1');
    });

    it('leaves activeIncident null when no active incident exists', async () => {
      vi.mocked(incidentService.findActiveIncident).mockResolvedValue(null);

      const { result } = renderHook(() => useIncidentStore());

      await act(async () => {
        await result.current.hydrateActiveIncident();
      });

      expect(result.current.activeIncident).toBeNull();
    });
  });

  describe('appendJournal (BR-8, BR-9, BR-30, AC-4)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('AC-4: Given an active incident 92s old, When appendJournal is called, Then optimistic entry has elapsedSeconds = 92', async () => {
      const startedAt = new Date('2026-05-02T10:00:00.000Z');
      vi.setSystemTime(new Date(startedAt.getTime() + 92_000));
      vi.mocked(incidentService.appendJournal).mockResolvedValue(
        fakeActive({ startedAt, journal: [] })
      );
      useIncidentStore.setState({ activeIncident: fakeActive({ startedAt }) });

      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.appendJournal('shaking starting');
      });

      const entries = result.current.activeIncident!.journal;
      expect(entries).toHaveLength(1);
      expect(entries[0]!.elapsedSeconds).toBe(92);
      expect(entries[0]!.text).toBe('shaking starting');

      // Service receives the SAME `now` the store used — guarantees persisted
      // elapsedSeconds matches the optimistic value (no ms drift).
      expect(incidentService.appendJournal).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          incidentId: 'incident-1',
          text: 'shaking starting',
          now: expect.any(Date),
        })
      );
      const passedNow = vi.mocked(incidentService.appendJournal).mock
        .calls[0]![0].now!;
      expect(
        Math.floor((passedNow.getTime() - startedAt.getTime()) / 1000)
      ).toBe(92);
    });

    it('is a no-op when no active incident exists', async () => {
      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.appendJournal('some text');
      });

      expect(incidentService.appendJournal).not.toHaveBeenCalled();
    });

    it('is a no-op when no auth user exists', async () => {
      (useAuthStore.getState as Mock).mockReturnValue({ user: null });
      useIncidentStore.setState({ activeIncident: fakeActive() });
      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.appendJournal('some text');
      });

      expect(incidentService.appendJournal).not.toHaveBeenCalled();
    });

    it('captures error on persist failure', async () => {
      vi.mocked(incidentService.appendJournal).mockRejectedValue(
        new Error('append-fail')
      );
      useIncidentStore.setState({ activeIncident: fakeActive() });
      const { result } = renderHook(() => useIncidentStore());
      await act(async () => {
        await result.current.appendJournal('some text');
      });

      expect(result.current.error).toBe('append-fail');
    });
  });
});

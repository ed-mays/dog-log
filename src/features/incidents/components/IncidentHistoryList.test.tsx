import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentHistoryList } from './IncidentHistoryList';
import type { Incident } from '@features/incidents/types';
import type { UseIncidentHistoryResult } from '../hooks/useIncidentHistory';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../hooks/useIncidentHistory');

import { useIncidentHistory } from '../hooks/useIncidentHistory';

const userId = 'user-1';
const startedAt1 = new Date('2026-05-02T10:00:00.000Z');
const startedAt2 = new Date('2026-05-01T08:00:00.000Z');

function fakeIncident(over: Partial<Incident> = {}): Incident {
  return {
    id: 'incident-1',
    userId,
    createdBy: userId,
    petId: 'pet-1',
    startedAt: startedAt1,
    endedAt: null,
    type: null,
    severity: null,
    chips: [],
    journal: [],
    deletedAt: null,
    createdAt: startedAt1,
    updatedAt: startedAt1,
    ...over,
  };
}

function installHookMock(result: UseIncidentHistoryResult) {
  vi.mocked(useIncidentHistory).mockReturnValue(result);
}

describe('IncidentHistoryList (BR-23, BR-24, BR-25, AC-9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('Given loading=true, renders no list items', () => {
    installHookMock({ incidents: [], loading: true, error: null });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('Given error, renders error message (role=alert)', () => {
    installHookMock({
      incidents: [],
      loading: false,
      error: 'Firestore read failed',
    });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Firestore read failed'
    );
  });

  it('Given empty list, renders no list item buttons', () => {
    installHookMock({ incidents: [], loading: false, error: null });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // AC-9 Given/When/Then: two incidents visible, hook excludes soft-deleted at repo layer
  it('AC-9: Given hook returns 2 non-deleted incidents, renders 2 rows (BR-24)', () => {
    const incidents = [
      fakeIncident({ id: 'i-2', startedAt: startedAt1 }),
      fakeIncident({ id: 'i-1', startedAt: startedAt2 }),
    ];
    installHookMock({ incidents, loading: false, error: null });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  // AC-9: soft-deleted excluded — hook returns only 1 (soft-delete filter at repo/service layer)
  it('AC-9: Given hook returns 1 row (soft-deleted incident excluded by repo), renders exactly 1 row', () => {
    installHookMock({
      incidents: [fakeIncident({ id: 'i-visible', deletedAt: null })],
      loading: false,
      error: null,
    });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  // BR-24: null type shows "untyped" label
  it('Given incident with type=null, shows untyped label (BR-24)', () => {
    installHookMock({
      incidents: [fakeIncident({ id: 'i-1', type: null })],
      loading: false,
      error: null,
    });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.getByRole('button')).toHaveTextContent(
      'incidents.history.untyped'
    );
  });

  // BR-24: set type shown
  it('Given incident with type=seizure, shows type label (BR-24)', () => {
    installHookMock({
      incidents: [fakeIncident({ id: 'i-1', type: 'seizure' })],
      loading: false,
      error: null,
    });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.getByRole('button')).toHaveTextContent('seizure');
  });

  // BR-24: journal excerpt shown
  it('Given incident with journal entries, shows first entry as excerpt (BR-24)', () => {
    installHookMock({
      incidents: [
        fakeIncident({
          id: 'i-1',
          journal: [
            {
              elapsedSeconds: 10,
              text: 'Started twitching',
              addedAt: new Date(),
            },
          ],
        }),
      ],
      loading: false,
      error: null,
    });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.getByRole('button')).toHaveTextContent('Started twitching');
  });

  // BR-24: duration shown when endedAt set
  it('Given stopped incident, shows duration in seconds (BR-24)', () => {
    const endedAt = new Date(startedAt1.getTime() + 90_000); // 1m 30s
    installHookMock({
      incidents: [fakeIncident({ id: 'i-1', endedAt })],
      loading: false,
      error: null,
    });
    render(<IncidentHistoryList petId="pet-1" />);
    expect(screen.getByRole('button')).toHaveTextContent('1m 30s');
  });

  // BR-25: tapping row navigates to saved incident page
  it('When row tapped, navigates to /pets/:petId/incidents/:id (BR-25)', async () => {
    installHookMock({
      incidents: [fakeIncident({ id: 'incident-abc' })],
      loading: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IncidentHistoryList petId="pet-1" />);
    await user.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith(
      '/pets/pet-1/incidents/incident-abc'
    );
  });
});

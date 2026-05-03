import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentCaptureSurface } from './IncidentCaptureSurface';
import type { Incident } from '@features/incidents/types';
import { useIncidentStore, type IncidentState } from '@store/useIncidentStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@store/useIncidentStore');

vi.mock('@features/incidents/hooks/useIncidentTimer', () => ({
  useIncidentTimer: () => '00:01:05',
}));

// Mock child components to isolate surface composition
vi.mock('./SeverityChips', () => ({
  SeverityChips: () => <div data-testid="severity-chips" />,
}));

vi.mock('./ObservationChips', () => ({
  ObservationChips: () => <div data-testid="observation-chips" />,
}));

vi.mock('./IncidentJournal', () => ({
  IncidentJournal: () => <div data-testid="incident-journal" />,
}));

vi.mock('./VetCallCard', () => ({
  VetCallCard: () => <div data-testid="vet-call-card" />,
}));

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  const now = new Date('2026-05-02T10:00:00.000Z');
  return {
    id: 'inc-1',
    userId: 'user-1',
    createdBy: 'user-1',
    petId: 'pet-1',
    startedAt: now,
    endedAt: null,
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

describe('IncidentCaptureSurface', () => {
  const mockStopIncident = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIncidentStore).mockReturnValue({
      stopIncident: mockStopIncident,
    } as unknown as IncidentState);
  });

  describe('active state (endedAt === null)', () => {
    it('renders full surface: timer, STOP button, and all sub-sections', () => {
      render(<IncidentCaptureSurface incident={makeIncident()} />);

      expect(screen.getByText('00:01:05')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'incidents.stop' })
      ).toBeInTheDocument();
      expect(screen.getByTestId('severity-chips')).toBeInTheDocument();
      expect(screen.getByTestId('observation-chips')).toBeInTheDocument();
      expect(screen.getByTestId('incident-journal')).toBeInTheDocument();
      expect(screen.getByTestId('vet-call-card')).toBeInTheDocument();
    });
  });

  describe('stopped state (endedAt !== null, BR-14, BR-25)', () => {
    it('renders full surface without STOP button; all other sections stay mounted', () => {
      const incident = makeIncident({
        endedAt: new Date('2026-05-02T10:01:05.000Z'),
      });
      render(<IncidentCaptureSurface incident={incident} />);

      expect(screen.getByText('00:01:05')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'incidents.stop' })
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('severity-chips')).toBeInTheDocument();
      expect(screen.getByTestId('observation-chips')).toBeInTheDocument();
      expect(screen.getByTestId('incident-journal')).toBeInTheDocument();
      expect(screen.getByTestId('vet-call-card')).toBeInTheDocument();
    });
  });

  it('STOP click calls stopIncident and surface stays mounted (BR-14)', async () => {
    const user = userEvent.setup();
    render(<IncidentCaptureSurface incident={makeIncident()} />);

    await user.click(screen.getByRole('button', { name: 'incidents.stop' }));

    expect(mockStopIncident).toHaveBeenCalledOnce();
    // Surface stays mounted — BR-14 requires no navigation away
    expect(screen.getByText('00:01:05')).toBeInTheDocument();
    expect(screen.getByTestId('severity-chips')).toBeInTheDocument();
  });
});

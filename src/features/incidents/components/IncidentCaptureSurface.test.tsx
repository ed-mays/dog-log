import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('renders timer and STOP button given an active incident (endedAt === null, BR-14)', () => {
    const incident = makeIncident({ endedAt: null });
    render(<IncidentCaptureSurface incident={incident} />);

    expect(screen.getByText('00:01:05')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'incidents.stop' })
    ).toBeInTheDocument();
  });

  it('renders timer but no STOP button given a stopped incident (endedAt !== null, BR-25)', () => {
    const incident = makeIncident({
      endedAt: new Date('2026-05-02T10:01:05.000Z'),
    });
    render(<IncidentCaptureSurface incident={incident} />);

    expect(screen.getByText('00:01:05')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'incidents.stop' })
    ).not.toBeInTheDocument();
  });
});

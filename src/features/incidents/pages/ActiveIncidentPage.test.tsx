import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActiveIncidentPage from './ActiveIncidentPage';
import { useIncidentStore, type IncidentState } from '@store/useIncidentStore';
import { Navigate } from 'react-router-dom';
import type { Incident } from '@features/incidents/types';

vi.mock('react-router-dom', () => ({
  Navigate: vi.fn(() => null),
}));

vi.mock('@store/useIncidentStore');

vi.mock('../components/IncidentCaptureSurface', () => ({
  IncidentCaptureSurface: ({ incident }: { incident: Incident }) => (
    <div
      data-testid="incident-capture-surface"
      data-incident-id={incident.id}
    />
  ),
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

describe('ActiveIncidentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders IncidentCaptureSurface when an active incident exists', () => {
    const incident = makeIncident();
    vi.mocked(useIncidentStore).mockReturnValue({
      activeIncident: incident,
    } as unknown as IncidentState);

    render(<ActiveIncidentPage />);

    const surface = screen.getByTestId('incident-capture-surface');
    expect(surface).toBeInTheDocument();
    expect(surface).toHaveAttribute('data-incident-id', 'inc-1');
  });

  it('redirects to /pets when no active incident exists', () => {
    vi.mocked(useIncidentStore).mockReturnValue({
      activeIncident: null,
    } as unknown as IncidentState);

    render(<ActiveIncidentPage />);

    expect(vi.mocked(Navigate)).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/pets', replace: true }),
      undefined
    );
    expect(
      screen.queryByTestId('incident-capture-surface')
    ).not.toBeInTheDocument();
  });
});

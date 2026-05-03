import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SavedIncidentPage from './SavedIncidentPage';
import { useSavedIncident } from '../hooks/useSavedIncident';
import { Navigate } from 'react-router-dom';
import type { Incident } from '@features/incidents/types';

vi.mock('react-router-dom', () => ({
  Navigate: vi.fn(() => null),
  useParams: vi.fn(() => ({ petId: 'pet-1', incidentId: 'inc-1' })),
}));

vi.mock('../hooks/useSavedIncident');

vi.mock('../components/IncidentCaptureSurface', () => ({
  IncidentCaptureSurface: ({ incident }: { incident: Incident }) => (
    <div
      data-testid="incident-capture-surface"
      data-incident-id={incident.id}
    />
  ),
}));

vi.mock('@components/common/LoadingIndicator/LoadingIndicator', () => ({
  LoadingIndicator: () => <div data-testid="loading-indicator" />,
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

describe('SavedIncidentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator while hook returns undefined', () => {
    vi.mocked(useSavedIncident).mockReturnValue(undefined);
    render(<SavedIncidentPage />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('renders IncidentCaptureSurface when incident is found', () => {
    vi.mocked(useSavedIncident).mockReturnValue(makeIncident());
    render(<SavedIncidentPage />);
    const surface = screen.getByTestId('incident-capture-surface');
    expect(surface).toBeInTheDocument();
    expect(surface).toHaveAttribute('data-incident-id', 'inc-1');
  });

  it('redirects to /pets when incident is not found', () => {
    vi.mocked(useSavedIncident).mockReturnValue(null);
    render(<SavedIncidentPage />);
    expect(vi.mocked(Navigate)).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/pets', replace: true }),
      undefined
    );
    expect(
      screen.queryByTestId('incident-capture-surface')
    ).not.toBeInTheDocument();
  });

  it('redirects to /pets when incident petId does not match route petId', () => {
    vi.mocked(useSavedIncident).mockReturnValue(
      makeIncident({ petId: 'pet-other' })
    );
    render(<SavedIncidentPage />);
    expect(vi.mocked(Navigate)).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/pets', replace: true }),
      undefined
    );
  });
});

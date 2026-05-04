import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResumeIncidentBanner } from './ResumeIncidentBanner';
import { useIncidentStore, type IncidentState } from '@store/useIncidentStore';
import type { Incident } from '@features/incidents/types';

const mockNavigate = vi.fn();
const routerState = { pathname: '/pets' };

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: routerState.pathname }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@store/useIncidentStore');

const startedAt = new Date('2026-05-02T10:00:00.000Z');

function fakeIncident(over: Partial<Incident> = {}): Incident {
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

function installIncidentStoreMock(activeIncident: Incident | null) {
  vi.mocked(useIncidentStore).mockImplementation(
    (selector?: (s: IncidentState) => unknown) => {
      const state: IncidentState = {
        activeIncident,
        isLoading: false,
        error: null,
        startIncident: vi.fn(),
        stopIncident: vi.fn(),
        hydrateActiveIncident: vi.fn(),
        setSeverity: vi.fn(),
        clearSeverity: vi.fn(),
        appendJournal: vi.fn(),
        toggleChip: vi.fn(),
      };
      return selector ? selector(state) : state;
    }
  );
}

describe('ResumeIncidentBanner (DQ-2, BR-26)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    routerState.pathname = '/pets';
    sessionStorage.clear();
  });

  it('Given active incident with endedAt=null, renders banner', () => {
    installIncidentStoreMock(fakeIncident());
    render(<ResumeIncidentBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('Given active incident, banner offers resume action', () => {
    installIncidentStoreMock(fakeIncident());
    render(<ResumeIncidentBanner />);
    expect(
      screen.getByRole('button', { name: 'incidents.resumeBanner.action' })
    ).toBeInTheDocument();
  });

  it('Given no active incident, renders nothing', () => {
    installIncidentStoreMock(null);
    render(<ResumeIncidentBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Given active incident with endedAt set (stopped), renders nothing', () => {
    installIncidentStoreMock(
      fakeIncident({ endedAt: new Date('2026-05-02T10:30:00.000Z') })
    );
    render(<ResumeIncidentBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('When dismiss is clicked, banner disappears (dismissible per-session, DQ-2)', async () => {
    installIncidentStoreMock(fakeIncident());
    const user = userEvent.setup();
    render(<ResumeIncidentBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('When resume button clicked, navigates to /incidents/active (no auto-navigation)', async () => {
    installIncidentStoreMock(fakeIncident());
    const user = userEvent.setup();
    render(<ResumeIncidentBanner />);
    // Assert no auto-navigation on mount
    expect(mockNavigate).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'incidents.resumeBanner.action' })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/incidents/active');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  // T-30 gap-fix: route exclusion
  it('When current route is /incidents/active, renders nothing (T-30 spec)', () => {
    installIncidentStoreMock(fakeIncident());
    routerState.pathname = '/incidents/active';
    render(<ResumeIncidentBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // T-30 gap-fix: dismissal persists per session via sessionStorage
  it('When dismissed, sessionStorage is set so the banner stays hidden across remounts', async () => {
    installIncidentStoreMock(fakeIncident());
    const user = userEvent.setup();
    const view = render(<ResumeIncidentBanner />);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(sessionStorage.getItem('incidents.resumeBanner.dismissed')).toBe(
      '1'
    );
    view.unmount();
    render(<ResumeIncidentBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('When sessionStorage already has the dismissal flag, renders nothing on first mount', () => {
    installIncidentStoreMock(fakeIncident());
    sessionStorage.setItem('incidents.resumeBanner.dismissed', '1');
    render(<ResumeIncidentBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmergencyActivationFab } from './EmergencyActivationFab';
import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';
import { useIncidentStore, type IncidentState } from '@store/useIncidentStore';
import { usePetsStore } from '@store/pets.store';
import { useAuthStore } from '@store/auth.store';
import type { Pet } from '@features/pets/types';

// Mutable state read inside the vi.mock factory — lets each test vary the router.
const routerState = {
  pathname: '/pets',
  params: {} as Record<string, string>,
  navigate: vi.fn(),
};

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useLocation: () => ({ pathname: routerState.pathname }),
    useNavigate: () => routerState.navigate,
    useParams: () => routerState.params,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@featureFlags/hooks/useFeatureFlag');
vi.mock('@store/useIncidentStore');
vi.mock('@store/pets.store');
vi.mock('@store/auth.store');
vi.mock('@features/incidents/components/ActivationPetPicker', () => ({
  ActivationPetPicker: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="activation-pet-picker">
        <button type="button" onClick={onClose}>
          close-picker
        </button>
      </div>
    ) : null,
}));

function makePet(id: string): Pet {
  return {
    id,
    name: 'Buddy',
    breed: 'Lab',
    birthDate: new Date('2020-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    isArchived: false,
    photos: [],
  };
}

type SetupOptions = {
  flagOn?: boolean;
  user?: { uid: string } | null;
  pathname?: string;
  params?: Record<string, string>;
  activeIncident?: IncidentState['activeIncident'];
  pets?: Pet[];
  startIncident?: ReturnType<typeof vi.fn>;
};

function setupDefaults({
  flagOn = true,
  user = { uid: 'user-1' },
  pathname = '/pets',
  params = {},
  activeIncident = null,
  pets = [makePet('pet-1')],
  startIncident = vi.fn().mockResolvedValue(undefined),
}: SetupOptions = {}) {
  vi.mocked(useFeatureFlag).mockReturnValue(flagOn);
  // useAuthStore is called with a selector: useAuthStore((s) => s.user)
  vi.mocked(useAuthStore).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: any) => (selector ? selector({ user }) : { user })
  );
  routerState.pathname = pathname;
  routerState.params = params;
  routerState.navigate = vi.fn();
  vi.mocked(useIncidentStore).mockReturnValue({
    activeIncident,
    startIncident,
  } as unknown as IncidentState);
  // usePetsStore is called with a selector: usePetsStore((s) => s.pets)
  vi.mocked(usePetsStore).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: any) => (selector ? selector({ pets }) : { pets })
  );
}

describe('EmergencyActivationFab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it('renders the FAB when all visibility conditions are satisfied', () => {
    render(<EmergencyActivationFab />);
    expect(
      screen.getByRole('button', { name: 'incidents.activate' })
    ).toBeInTheDocument();
  });

  // Verify line AC: tap with petId fires startIncident synchronously and navigates
  it('fires startIncident with petId from route param and navigates to /incidents/active', async () => {
    const startIncident = vi.fn().mockResolvedValue(undefined);
    setupDefaults({ params: { id: 'pet-1' }, startIncident });

    const user = userEvent.setup();
    render(<EmergencyActivationFab />);

    await user.click(
      screen.getByRole('button', { name: 'incidents.activate' })
    );

    // startIncident is called synchronously (before the async write resolves — §D8 NFR-2)
    expect(startIncident).toHaveBeenCalledWith({ petId: 'pet-1' });
    expect(routerState.navigate).toHaveBeenCalledWith('/incidents/active');
    // navigate fires in the same synchronous event handler, before the promise resolves
    const startOrder = startIncident.mock.invocationCallOrder[0];
    const navOrder = routerState.navigate.mock.invocationCallOrder[0];
    expect(navOrder).toBeGreaterThan(startOrder);
  });

  it('fires startIncident with the only pet id when on non-pet-scoped surface', async () => {
    const startIncident = vi.fn().mockResolvedValue(undefined);
    setupDefaults({
      params: {},
      pets: [makePet('pet-solo')],
      startIncident,
    });

    const user = userEvent.setup();
    render(<EmergencyActivationFab />);

    await user.click(
      screen.getByRole('button', { name: 'incidents.activate' })
    );

    expect(startIncident).toHaveBeenCalledWith({ petId: 'pet-solo' });
    expect(routerState.navigate).toHaveBeenCalledWith('/incidents/active');
  });

  it('navigates to /incidents/active without starting a new incident when one is already active (BR-26)', async () => {
    const startIncident = vi.fn();
    setupDefaults({
      activeIncident: {
        id: 'inc-active',
      } as unknown as IncidentState['activeIncident'],
      startIncident,
    });

    const user = userEvent.setup();
    render(<EmergencyActivationFab />);

    await user.click(
      screen.getByRole('button', { name: 'incidents.activate' })
    );

    expect(startIncident).not.toHaveBeenCalled();
    expect(routerState.navigate).toHaveBeenCalledWith('/incidents/active');
  });

  // Verify line: hidden when unauthenticated
  it('is hidden when user is unauthenticated (user === null)', () => {
    setupDefaults({ user: null });
    render(<EmergencyActivationFab />);
    expect(
      screen.queryByRole('button', { name: 'incidents.activate' })
    ).not.toBeInTheDocument();
  });

  // Verify line: hidden when on /incidents/active
  it('is hidden when the current route is /incidents/active', () => {
    setupDefaults({ pathname: '/incidents/active' });
    render(<EmergencyActivationFab />);
    expect(
      screen.queryByRole('button', { name: 'incidents.activate' })
    ).not.toBeInTheDocument();
  });

  // Verify line: hidden when flag off
  it('is hidden when incidentsEnabled feature flag is off', () => {
    setupDefaults({ flagOn: false });
    render(<EmergencyActivationFab />);
    expect(
      screen.queryByRole('button', { name: 'incidents.activate' })
    ).not.toBeInTheDocument();
  });

  it('is hidden when user has zero pets (BR-27 zero-pet exception)', () => {
    setupDefaults({ pets: [] });
    render(<EmergencyActivationFab />);
    expect(
      screen.queryByRole('button', { name: 'incidents.activate' })
    ).not.toBeInTheDocument();
  });

  it('closes ActivationPetPicker when its onClose fires (operator-backfill for coverage gate)', async () => {
    setupDefaults({
      params: {},
      pets: [makePet('pet-1'), makePet('pet-2')],
    });

    const user = userEvent.setup();
    render(<EmergencyActivationFab />);

    await user.click(
      screen.getByRole('button', { name: 'incidents.activate' })
    );
    expect(screen.getByTestId('activation-pet-picker')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'close-picker' }));
    expect(
      screen.queryByTestId('activation-pet-picker')
    ).not.toBeInTheDocument();
  });

  // AC-19: non-pet-scoped surface, multiple pets → open ActivationPetPicker (BR-28 third rule)
  it('opens ActivationPetPicker when multiple pets and surface is non-pet-scoped (AC-19)', async () => {
    const startIncident = vi.fn();
    setupDefaults({
      params: {},
      pets: [makePet('pet-1'), makePet('pet-2')],
      startIncident,
    });

    const user = userEvent.setup();
    render(<EmergencyActivationFab />);

    await user.click(
      screen.getByRole('button', { name: 'incidents.activate' })
    );

    expect(screen.getByTestId('activation-pet-picker')).toBeInTheDocument();
    expect(startIncident).not.toHaveBeenCalled();
    expect(routerState.navigate).not.toHaveBeenCalled();
  });
});

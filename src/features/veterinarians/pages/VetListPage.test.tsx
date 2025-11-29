import { vi, describe, beforeEach, it, expect } from 'vitest';
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/vetService');
vi.mock('@services/analytics/analytics', () => ({
  track: vi.fn(),
}));

import { render, screen, fireEvent } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { makeVet } from '@testUtils/factories/makeVet';
import { routerState, setupRouterMock } from '@testUtils/mocks/mockRouter';
import { installVetServiceMock } from '@testUtils/mocks/mockVetService';
import { track } from '@services/analytics/analytics';

// Setup router mock
setupRouterMock();

describe('VetListPage', () => {
  const vetServiceMock = installVetServiceMock();

  beforeEach(() => {
    vi.resetAllMocks();
    routerState.params = {};
    routerState.navigate = vi.fn();
    installAuthStoreMock({
      user: {
        uid: 'user1',
        email: 't@t.com',
        displayName: 'T',
        photoURL: null,
      },
    });
  });

  it('renders empty state when no vets found', async () => {
    vetServiceMock.searchVets.mockResolvedValue([]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    expect(
      await screen.findByText(/no veterinarians yet|list.empty/i)
    ).toBeInTheDocument();
  });

  it('renders list of vets', async () => {
    const v1 = makeVet({ name: 'Dr. A', clinicName: 'Clinic A' });
    const v2 = makeVet({ name: 'Dr. B', clinicName: 'Clinic B' });
    vetServiceMock.searchVets.mockResolvedValue([v1, v2]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    expect(await screen.findByText('Dr. A')).toBeInTheDocument();
    expect(screen.getByText(/clinic a/i)).toBeInTheDocument();
    expect(screen.getByText('Dr. B')).toBeInTheDocument();
  });

  it('navigates to add page', async () => {
    vetServiceMock.searchVets.mockResolvedValue([]);
    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    const addBtn = await screen.findByRole('button', {
      name: /add|actions.add/i,
    });
    await userEvent.click(addBtn);

    expect(routerState.navigate).toHaveBeenCalledWith('/vets/add');
  });

  it('navigates to edit page on item click', async () => {
    const v1 = makeVet({ id: 'v1', name: 'Dr. A' });
    vetServiceMock.searchVets.mockResolvedValue([v1]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    const item = await screen.findByText('Dr. A');
    await userEvent.click(item);

    expect(routerState.navigate).toHaveBeenCalledWith('/vets/v1/edit');
  });

  it('filters list by search term', async () => {
    const user = userEvent.setup();
    const v1 = makeVet({ name: 'Dr. Alpha' });
    const v2 = makeVet({ name: 'Dr. Beta' });
    vetServiceMock.searchVets.mockResolvedValue([v1, v2]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    await screen.findByText('Dr. Alpha');

    const searchInput = screen.getByRole('textbox', {
      name: /search|list.searchPlaceholder/i,
    });
    await user.type(searchInput, 'alpha');

    expect(screen.getByText('Dr. Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Dr. Beta')).not.toBeInTheDocument();
  });

  it('swallows errors from service and shows empty state', async () => {
    vetServiceMock.searchVets.mockRejectedValue(new Error('permission denied'));

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    expect(
      await screen.findByText(/no veterinarians yet|list.empty/i)
    ).toBeInTheDocument();
  });

  it('search filters by clinic name', async () => {
    const user = userEvent.setup();
    const v1 = makeVet({ name: 'Dr. A', clinicName: 'Happy Paws' });
    const v2 = makeVet({ name: 'Dr. B', clinicName: 'City Vet' });
    vetServiceMock.searchVets.mockResolvedValue([v1, v2]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    await screen.findByText('Dr. A');

    const searchInput = screen.getByRole('textbox', {
      name: /search|list.searchPlaceholder/i,
    });
    await user.type(searchInput, 'happy');

    expect(screen.getByText('Dr. A')).toBeInTheDocument();
    expect(screen.queryByText('Dr. B')).not.toBeInTheDocument();
  });

  it('search filters by specialties', async () => {
    const user = userEvent.setup();
    const v1 = makeVet({ name: 'Dr. A', specialties: ['Surgery'] });
    const v2 = makeVet({ name: 'Dr. B', specialties: ['Dentistry'] });
    vetServiceMock.searchVets.mockResolvedValue([v1, v2]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    await screen.findByText('Dr. A');

    const searchInput = screen.getByRole('textbox', {
      name: /search|list.searchPlaceholder/i,
    });
    await user.type(searchInput, 'surgery');

    expect(screen.getByText('Dr. A')).toBeInTheDocument();
    expect(screen.queryByText('Dr. B')).not.toBeInTheDocument();
  });

  it('fires vet_search telemetry with term length', async () => {
    const v1 = makeVet({ name: 'Dr. A' });
    vetServiceMock.searchVets.mockResolvedValue([v1]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    await screen.findByText('Dr. A');

    vi.useFakeTimers();

    const searchInput = screen.getByRole('textbox', {
      name: /search|list.searchPlaceholder/i,
    });

    // eslint-disable-next-line no-restricted-syntax -- userEvent triggers timeouts with fake timers here
    fireEvent.change(searchInput, { target: { value: 'abc' } });
    expect(searchInput).toHaveValue('abc');

    // Advance time to trigger debounce
    vi.advanceTimersByTime(1100);

    // Flush promises (dynamic import in setTimeout)
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }

    expect(track).toHaveBeenCalledWith('vet_search', { term_length: 3 });

    vi.useRealTimers();
  });
});

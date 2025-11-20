import { vi, describe, beforeEach, it, expect } from 'vitest';
vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/vetService');

import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { makeVet } from '@testUtils/factories/makeVet';
import { mockRouter } from '@testUtils/mocks/mockRouter';
import { installVetServiceMock } from '@testUtils/mocks/mockVetService';

describe('VetListPage', () => {
  const { navigate } = mockRouter();
  const vetServiceMock = installVetServiceMock();

  beforeEach(() => {
    vi.resetAllMocks();
    installAuthStoreMock({ user: { uid: 'user1' } });
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

    expect(navigate).toHaveBeenCalledWith('/vets/add');
  });

  it('navigates to edit page on item click', async () => {
    const v1 = makeVet({ id: 'v1', name: 'Dr. A' });
    vetServiceMock.searchVets.mockResolvedValue([v1]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    const item = await screen.findByText('Dr. A');
    await userEvent.click(item);

    expect(navigate).toHaveBeenCalledWith('/vets/v1/edit');
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
});

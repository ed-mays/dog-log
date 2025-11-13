vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/vetService');

import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { vetService } from '@services/vetService';
import type { Vet } from '@models/vets';

const mockedVetService = vetService as unknown as {
  searchVets: ReturnType<typeof vi.fn>;
};

function makeVet(overrides: Partial<Vet>): Vet {
  return {
    id: 'v1',
    ownerUserId: 'user1',
    name: 'Dr. Placeholder',
    phone: '555-0000',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    createdBy: 'user1',
    _normName: 'dr. placeholder',
    _e164Phone: '5550000',
    // Optional fields default empty
    email: undefined,
    website: undefined,
    clinicName: undefined,
    address: undefined,
    specialties: undefined,
    notes: undefined,
    isArchived: undefined,
    archivedAt: undefined,
    archivedBy: undefined,
    ...overrides,
  };
}

describe('VetListPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installAuthStoreMock({ user: { uid: 'user1' }, initializing: false });
  });

  it('shows empty state when there are no veterinarians', async () => {
    (mockedVetService.searchVets as unknown as vi.Mock).mockResolvedValueOnce(
      []
    );

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    expect(
      await screen.findByText(/no veterinarians yet|aún no hay veterinarios/i)
    ).toBeInTheDocument();
  });

  it('renders a list of veterinarians and filters by search', async () => {
    (mockedVetService.searchVets as unknown as vi.Mock).mockResolvedValueOnce([
      makeVet({
        id: '1',
        name: 'Dr. Alice',
        phone: '555-1111',
        clinicName: 'Happy Pets',
        specialties: ['surgery'],
      }),
      makeVet({
        id: '2',
        name: 'Dr. Bob',
        phone: '555-2222',
        clinicName: 'Calm Critters',
        specialties: ['dermatology'],
      }),
    ]);

    const { default: VetListPage } = await import('./VetListPage');
    render(<VetListPage />);

    // Wait for items
    expect(await screen.findByText(/dr\. alice/i)).toBeInTheDocument();
    expect(screen.getByText(/dr\. bob/i)).toBeInTheDocument();

    // Filter
    const user = userEvent.setup();
    const search = screen.getByRole('textbox', { name: /search|buscar/i });
    await user.clear(search);
    await user.type(search, 'alice');

    expect(screen.getByText(/dr\. alice/i)).toBeInTheDocument();
    expect(screen.queryByText(/dr\. bob/i)).not.toBeInTheDocument();
  });

  it('navigates when clicking Add and list item; swallows errors from service and shows empty state', async () => {
    vi.resetModules();
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return { ...mod, useNavigate: () => navSpy };
    });

    // First render: service throws → empty state via catch
    (mockedVetService.searchVets as unknown as vi.Mock).mockRejectedValueOnce(
      new Error('permission denied')
    );

    let mod = await import('./VetListPage');
    render(<mod.default />);
    expect(
      await screen.findByText(/no veterinarians yet|aún no hay veterinarios/i)
    ).toBeInTheDocument();

    // Second render: list two vets and assert navigation
    vi.resetModules();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod2: never = await importOriginal();
      return { ...mod2, useNavigate: () => navSpy };
    });
    (mockedVetService.searchVets as unknown as vi.Mock).mockResolvedValueOnce([
      makeVet({ id: '10', name: 'Dr. Ten' }),
      makeVet({ id: '20', name: 'Dr. Twenty' }),
    ]);

    mod = await import('./VetListPage');
    render(<mod.default />);
    expect(await screen.findByText(/dr\. ten/i)).toBeInTheDocument();

    const user = userEvent.setup();
    // Click Add (there may be multiple add buttons in the DOM from wrappers; pick the first visible one)
    const addButtons = screen.getAllByRole('button', { name: /add|agregar/i });
    await user.click(addButtons[0]);
    await waitFor(() => expect(navSpy).toHaveBeenCalledWith('/vets/add'));

    // Click item
    await user.click(screen.getByRole('button', { name: /dr\. ten/i }));
    await waitFor(() => expect(navSpy).toHaveBeenCalledWith('/vets/10/edit'));
  });
});

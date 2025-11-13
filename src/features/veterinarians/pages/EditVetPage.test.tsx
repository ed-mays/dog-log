vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/vetService');

import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { vetService } from '@services/vetService';

const mockedVetService = vetService as unknown as {
  getVet: ReturnType<typeof vi.fn>;
  updateVet: ReturnType<typeof vi.fn>;
};

describe('EditVetPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installAuthStoreMock({ user: { uid: 'user1' }, initializing: false });
  });

  it('fires vet_updated telemetry on successful submit', async () => {
    const user = userEvent.setup();
    vi.resetModules();

    // Mock router params and navigation
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: 'v1' }),
        useNavigate: () => navSpy,
      };
    });

    // Mock analytics module to capture dynamic import
    vi.doMock(
      '@services/analytics/analytics',
      () => ({
        track: vi.fn(),
      }),
      { virtual: true }
    );

    // Arrange: mock getVet to provide initial form values
    (mockedVetService.getVet as unknown as vi.Mock).mockResolvedValueOnce({
      id: 'v1',
      name: 'Dr. Jane',
      phone: '555-0000',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
      isArchived: false,
    });
    // Arrange: mock updateVet to resolve
    (mockedVetService.updateVet as unknown as vi.Mock).mockResolvedValueOnce(
      {}
    );

    const { default: EditVetPage } = await import('./EditVetPage');
    render(<EditVetPage />);

    // Wait for form to load (query by id to avoid i18n label dependency)
    const nameInput = await screen.findByRole('textbox', {
      name: (_name, el) => el.getAttribute('id') === 'vet-name',
    });

    // Make a small change
    await user.clear(nameInput);
    await user.type(nameInput, 'Dr. Janet');

    const submit = screen.getByRole('button', {
      name: (_name, el) => el.getAttribute('type') === 'submit',
    });
    await user.click(submit);

    const analytics = await import('@services/analytics/analytics');
    await waitFor(() => {
      expect(analytics.track).toHaveBeenCalledWith('vet_updated');
    });

    // Optional: ensure navigation occurred
    await waitFor(() => {
      expect(navSpy).toHaveBeenCalledWith('/vets');
    });
  });

  it('shows duplicate error when update throws DUPLICATE_VET and does not navigate', async () => {
    const user = userEvent.setup();
    vi.resetModules();
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: 'v1' }),
        useNavigate: () => navSpy,
      };
    });

    (mockedVetService.getVet as unknown as vi.Mock).mockResolvedValueOnce({
      id: 'v1',
      name: 'X',
      phone: '1',
    });
    (mockedVetService.updateVet as unknown as vi.Mock).mockRejectedValueOnce({
      code: 'DUPLICATE_VET',
    });

    const { default: EditVetPage } = await import('./EditVetPage');
    render(<EditVetPage />);

    const nameInput = await screen.findByRole('textbox', {
      name: (_n, el) => el.getAttribute('id') === 'vet-name',
    });
    await user.clear(nameInput);
    await user.type(nameInput, 'Y');
    await user.click(
      screen.getByRole('button', {
        name: (_n, el) => el.getAttribute('type') === 'submit',
      })
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      /already exists|ya existe|error\.duplicate/i
    );
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('shows generic error when update throws other error', async () => {
    const user = userEvent.setup();
    vi.resetModules();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: 'v1' }),
        useNavigate: () => vi.fn(),
      };
    });

    (mockedVetService.getVet as unknown as vi.Mock).mockResolvedValueOnce({
      id: 'v1',
      name: 'X',
      phone: '1',
    });
    (mockedVetService.updateVet as unknown as vi.Mock).mockRejectedValueOnce({
      code: 'OTHER',
    });

    const { default: EditVetPage } = await import('./EditVetPage');
    render(<EditVetPage />);

    const submit = await screen.findByRole('button', {
      name: (_n, el) => el.getAttribute('type') === 'submit',
    });
    await user.click(submit);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      /something went wrong|common:error\.generic/i
    );
  });

  it('cancel navigates back to /vets', async () => {
    const user = userEvent.setup();
    vi.resetModules();
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: 'v1' }),
        useNavigate: () => navSpy,
      };
    });

    (mockedVetService.getVet as unknown as vi.Mock).mockResolvedValueOnce({
      id: 'v1',
      name: 'X',
      phone: '1',
    });

    const { default: EditVetPage } = await import('./EditVetPage');
    render(<EditVetPage />);

    const cancelBtn = await screen.findByRole('button', {
      name: /cancel|cancelar/i,
    });
    await user.click(cancelBtn);
    await waitFor(() => expect(navSpy).toHaveBeenCalledWith('/vets'));
  });

  it('shows friendly message when getVet fails and no vet is loaded', async () => {
    vi.resetModules();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: 'missing' }),
        useNavigate: () => vi.fn(),
      };
    });

    (mockedVetService.getVet as unknown as vi.Mock).mockRejectedValueOnce(
      new Error('boom')
    );

    const { default: EditVetPage } = await import('./EditVetPage');
    render(<EditVetPage />);

    // Should show friendly text (Typography), not an alert
    expect(
      await screen.findByText(/something went wrong|common:somethingWentWrong/i)
    ).toBeInTheDocument();
  });
});

vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/vetService');

import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { vetService } from '@services/vetService';

const mockedVetService = vetService as unknown as {
  createVet: ReturnType<typeof vi.fn>;
};

describe('AddVetPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installAuthStoreMock({ user: { uid: 'user1' }, initializing: false });
  });

  it('shows duplicate error when service throws DUPLICATE_VET', async () => {
    const user = userEvent.setup();
    // Arrange: mock createVet to throw duplicate error
    (mockedVetService.createVet as unknown as vi.Mock).mockRejectedValueOnce({
      code: 'DUPLICATE_VET',
    });

    const { default: AddVetPage } = await import('./AddVetPage');
    render(<AddVetPage />);

    await user.type(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-name',
      }),
      'Dr. Jane'
    );
    await user.type(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-phone',
      }),
      '555-0000'
    );

    const submit = screen.getByRole('button', {
      name: (_name, el) => el.getAttribute('type') === 'submit',
    });
    await user.click(submit);

    // Error alert with i18n duplicate message
    const alert = await screen.findByRole('alert');
    // Accept either resolved i18n text or the i18n key if namespace not loaded in tests
    expect(alert).toHaveTextContent(
      /already exists|ya existe|error\.duplicate/i
    );
  });

  it('fires vet_created telemetry on successful submit', async () => {
    const user = userEvent.setup();
    vi.resetModules();

    // Mock analytics module to capture dynamic import
    vi.doMock(
      '@services/analytics/analytics',
      () => ({
        track: vi.fn(),
      }),
      { virtual: true }
    );

    // Arrange: mock createVet to resolve
    (mockedVetService.createVet as unknown as vi.Mock).mockResolvedValueOnce({
      id: 'v1',
    });

    const { default: AddVetPage } = await import('./AddVetPage');
    render(<AddVetPage />);

    await user.type(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-name',
      }),
      'Dr. Jane'
    );
    await user.type(
      screen.getByRole('textbox', {
        name: (_name, el) => el.getAttribute('id') === 'vet-phone',
      }),
      '555-0000'
    );

    const submit = screen.getByRole('button', {
      name: (_name, el) => el.getAttribute('type') === 'submit',
    });
    await user.click(submit);

    const analytics = await import('@services/analytics/analytics');
    await waitFor(() => {
      expect(analytics.track).toHaveBeenCalledWith('vet_created');
    });
  });

  it('shows generic error when service throws non-duplicate and does not navigate', async () => {
    const user = userEvent.setup();
    vi.resetModules();
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return { ...mod, useNavigate: () => navSpy };
    });

    (mockedVetService.createVet as unknown as vi.Mock).mockRejectedValueOnce({
      code: 'SOMETHING',
    });

    const { default: AddVetPage } = await import('./AddVetPage');
    render(<AddVetPage />);

    await user.type(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-name',
      }),
      'A'
    );
    await user.type(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-phone',
      }),
      '1'
    );
    await user.click(
      screen.getByRole('button', {
        name: (_n, el) => el.getAttribute('type') === 'submit',
      })
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      /something went wrong|common:somethingWentWrong/i
    );
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('cancel navigates back to /vets', async () => {
    const user = userEvent.setup();
    vi.resetModules();
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return { ...mod, useNavigate: () => navSpy };
    });

    const { default: AddVetPage } = await import('./AddVetPage');
    render(<AddVetPage />);

    await user.click(screen.getByRole('button', { name: /cancel|cancelar/i }));
    await waitFor(() => expect(navSpy).toHaveBeenCalledWith('/vets'));
  });

  it('does nothing when not authenticated (guards at routing level)', async () => {
    // No user id
    vi.resetAllMocks();
    installAuthStoreMock({
      user: null as unknown as { uid: string },
      initializing: false,
    });

    const user = userEvent.setup();
    (mockedVetService.createVet as unknown as vi.Mock).mockResolvedValueOnce(
      {}
    );

    const { default: AddVetPage } = await import('./AddVetPage');
    render(<AddVetPage />);

    await user.type(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-name',
      }),
      'A'
    );
    await user.type(
      screen.getByRole('textbox', {
        name: (_n, el) => el.getAttribute('id') === 'vet-phone',
      }),
      '1'
    );
    await user.click(
      screen.getByRole('button', {
        name: (_n, el) => el.getAttribute('type') === 'submit',
      })
    );

    expect(
      mockedVetService.createVet as unknown as vi.Mock
    ).not.toHaveBeenCalled();
  });
});

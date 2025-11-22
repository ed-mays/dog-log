vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/vetService');

import { render, screen, waitFor } from '@test-utils';
import { type Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import { installAuthStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { installVetServiceMock } from '@testUtils/mocks/mockVetService';

describe('AddVetPage', () => {
  let vetServiceMock: ReturnType<typeof installVetServiceMock>;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    installAuthStoreMock({
      user: {
        uid: 'user1',
        email: 't@t.com',
        displayName: 'T',
        photoURL: null,
      },
      initializing: false,
    });
    vetServiceMock = installVetServiceMock();
  });

  it('shows duplicate error when service throws DUPLICATE_VET', async () => {
    const user = userEvent.setup();
    // Arrange: mock createVet to throw duplicate error
    (vetServiceMock.createVet as unknown as Mock).mockRejectedValueOnce({
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

  it('shows generic error when service throws non-duplicate and does not navigate', async () => {
    const user = userEvent.setup();
    vi.resetModules();
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod = await importOriginal<typeof import('react-router-dom')>();
      return { ...mod, useNavigate: () => navSpy };
    });

    (vetServiceMock.createVet as unknown as Mock).mockRejectedValueOnce({
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
      const mod = await importOriginal<typeof import('react-router-dom')>();
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
      user: null,
      initializing: false,
    });

    const user = userEvent.setup();
    (vetServiceMock.createVet as unknown as Mock).mockResolvedValueOnce({});

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

    expect(vetServiceMock.createVet as unknown as Mock).not.toHaveBeenCalled();
  });
});

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makePet } from '@testUtils/factories/makePet';
import { vi } from 'vitest';
import { installPetsStoreMock } from '@testUtils/mocks/mockStoreInstallers';

// Mock the pets store at the top level to control actions
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

describe('PetCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default store with a no-op deletePet so selector usage in component is satisfied
    installPetsStoreMock({
      deletePet: vi.fn(),
    });
  });

  afterEach(() => {
    // Restore module graph to avoid cross-test contamination from vi.doMock
    vi.resetModules();
    vi.unmock('react-router-dom');
  });

  async function importComponent() {
    const mod = await import('./PetCard');
    return mod.default;
  }

  async function renderWithProviders(
    ui: React.ReactElement,
    options?: Record<string, unknown>
  ) {
    const { render } = await import('@test-utils');
    return render(ui, options as never);
  }

  test('renders provided pet name and breed within the MUI card structure and links to details page', async () => {
    const PetCard = await importComponent();
    const pet = makePet({ id: '123', name: 'Buddy', breed: 'Labrador' });

    await renderWithProviders(<PetCard pet={pet} />);

    // Header image exists
    const img = screen.getByRole('img', { name: /pet header/i });
    expect(img).toBeInTheDocument();

    // Name displayed as a heading (Typography with component h3)
    const nameHeading = screen.getByRole('heading', {
      name: 'Buddy',
      level: 3,
    });
    expect(nameHeading).toBeInTheDocument();

    // Breed text displayed
    expect(screen.getByText('Labrador')).toBeInTheDocument();

    // Entire card acts as a link to the pet details page
    const link = screen.getByRole('link', { name: /buddy/i });
    expect(link).toHaveAttribute('href', '/pets/123');
  });

  test('shows Edit/Delete when petActionsEnabled=true and navigates on Edit', async () => {
    const pet = makePet({ id: '1', name: 'Fido' });

    const navSpy = vi.fn();
    // Ensure the mock applies to a fresh module graph
    vi.resetModules();
    vi.doMock('react-router-dom', async () => {
      const mod =
        await vi.importActual<typeof import('react-router-dom')>(
          'react-router-dom'
        );
      return { ...mod, useNavigate: () => navSpy };
    });

    // Dynamically import both the component and the shared render AFTER mocking
    const [{ default: PetCardWithNav }, { render: localRender }] =
      await Promise.all([import('./PetCard'), import('@test-utils')]);

    localRender(<PetCardWithNav pet={pet} />, {
      featureFlags: { petActionsEnabled: true },
    });

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    expect(deleteBtn).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(editBtn);

    await waitFor(() => {
      expect(navSpy).toHaveBeenCalledWith('/pets/1/edit');
    });
  });

  test('delete success flow: opens modal, shows saving, calls deletePet, then closes', async () => {
    const pet = makePet({ id: '42', name: 'Rex' });

    let resolveDelete: () => void;
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    const deletePetMock = vi.fn(() => deletePromise);

    // Override store for this test
    installPetsStoreMock({ deletePet: deletePetMock });

    const PetCard = await importComponent();
    await renderWithProviders(<PetCard pet={pet} />, {
      featureFlags: { petActionsEnabled: true },
    });

    const user = userEvent.setup();

    // Open modal
    const delBtn = await screen.findByRole('button', { name: /delete/i });
    await user.click(delBtn);

    // Modal appears with confirmation text
    const dialog = await screen.findByRole('dialog');
    // Confirm title appears in the modal (matches ConfirmModal usage)
    expect(
      within(dialog).getByRole('heading', { name: /delete rex/i })
    ).toBeInTheDocument();

    // Confirm deletion
    const yesBtn = within(dialog).getByRole('button', { name: /yes/i });
    await user.click(yesBtn);

    // Resolve deletion
    // @ts-expect-error resolveDelete assigned in promise executor
    resolveDelete();
    await waitFor(() => expect(deletePetMock).toHaveBeenCalledWith('42'));

    // Modal closes and saving alert disappears
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('alert', { name: /saving/i })
      ).not.toBeInTheDocument();
    });
  });

  test('delete failure flow: shows error alert and closes modal', async () => {
    const pet = makePet({ id: '88', name: 'Bella' });
    const deletePetMock = vi.fn(async () => {
      throw new Error('boom');
    });

    // Override store for this test
    installPetsStoreMock({ deletePet: deletePetMock });

    const PetCard = await importComponent();
    await renderWithProviders(<PetCard pet={pet} />, {
      featureFlags: { petActionsEnabled: true },
    });

    const user = userEvent.setup();

    // Open modal and confirm
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /yes/i }));

    // Wait until delete action has been processed
    await waitFor(() => {
      expect(deletePetMock).toHaveBeenCalledWith('88');
    });

    // Error alert should appear on the card
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    // Modal should be closed after failure handling
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('declining in the confirm modal closes it without calling delete', async () => {
    const pet = makePet({ id: '9', name: 'Spot' });
    const deletePetMock = vi.fn();

    // Override store for this test
    installPetsStoreMock({ deletePet: deletePetMock });

    const PetCard = await importComponent();
    await renderWithProviders(<PetCard pet={pet} />, {
      featureFlags: { petActionsEnabled: true },
    });

    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /delete/i }));
    const dialog = await screen.findByRole('dialog');

    // Click "No"
    await user.click(within(dialog).getByRole('button', { name: /no/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(deletePetMock).not.toHaveBeenCalled();
    });
  });
});

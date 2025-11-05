import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makePet } from '@testUtils/factories/makePet';
import { vi } from 'vitest';

// Mock the pets store at the top level to control actions
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));
vi.mock('@store/pets.store.ts', () => ({
  usePetsStore: vi.fn(),
}));

let mockUsePetsStore: vi.Mock;
let renderTestUtils: typeof import('@test-utils').render;

describe('PetCard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const petsStoreModuleTs = await import('@store/pets.store.ts');
    mockUsePetsStore = petsStoreModuleTs.usePetsStore as vi.Mock; // use the same path PetCard uses
    const testUtilsModule = await import('@test-utils');
    renderTestUtils = testUtilsModule.render;
  });

  async function importComponent() {
    const mod = await import('./PetCard');
    return mod.default;
  }

  test('renders provided pet name and breed within the MUI card structure and links to details page', async () => {
    const PetCard = await importComponent();
    const pet = makePet({ id: '123', name: 'Buddy', breed: 'Labrador' });

    // Provide a no-op deletePet for the store selector usage
    mockUsePetsStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ deletePet: vi.fn() })
    );

    renderTestUtils(<PetCard pet={pet} />);

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

    mockUsePetsStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ deletePet: vi.fn() })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return { ...mod, useNavigate: () => navSpy };
    });

    // Import component after mocking react-router-dom
    const PetCardWithNav = await importComponent();

    renderTestUtils(<PetCardWithNav pet={pet} />, {
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

    mockUsePetsStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ deletePet: deletePetMock })
    );

    const PetCard = await importComponent();
    renderTestUtils(<PetCard pet={pet} />, {
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

    // While promise pending, saving indicator should be visible
    expect(await screen.findByText(/saving/i)).toBeInTheDocument();

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

    mockUsePetsStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ deletePet: deletePetMock })
    );

    const PetCard = await importComponent();
    renderTestUtils(<PetCard pet={pet} />, {
      featureFlags: { petActionsEnabled: true },
    });

    const user = userEvent.setup();

    // Open modal and confirm
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /yes/i }));

    // Error alert should appear on the card
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed/i);

    // Modal should be closed after failure handling
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('declining in the confirm modal closes it without calling delete', async () => {
    const pet = makePet({ id: '9', name: 'Spot' });
    const deletePetMock = vi.fn();
    mockUsePetsStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ deletePet: deletePetMock })
    );

    const PetCard = await importComponent();
    renderTestUtils(<PetCard pet={pet} />, {
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

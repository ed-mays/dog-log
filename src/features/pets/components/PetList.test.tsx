import React from 'react';
import { act } from 'react';
import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react'; // Import screen, waitFor, waitForElementToBeRemoved, and within directly
import userEvent from '@testing-library/user-event';
import type { Pet } from '../types';
import { makePet } from '@testUtils/factories/makePet';
import { createPetsStoreMock } from '@testUtils/mocks/mockStores';
import { vi } from 'vitest';

// Mock the module at the top level
vi.mock('@store/pets.store.ts', () => ({
  usePetsStore: vi.fn(),
}));

let mockUsePetsStore: vi.Mock;
let renderTestUtils: typeof import('@test-utils').render; // Declare type for render

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod: object = await importOriginal();
  return {
    ...mod,
    useNavigate: () => navigateMock,
  };
});

describe('PetList integration', () => {
  const user = userEvent.setup();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // Reset modules to ensure fresh mocks

    // Dynamically import the mocked module after resetModules
    const petsStoreModule = await import('@store/pets.store');
    mockUsePetsStore = petsStoreModule.usePetsStore as vi.Mock;

    // Dynamically import render from @test-utils after resetModules
    const testUtilsModule = await import('@test-utils');
    renderTestUtils = testUtilsModule.render;
  });

  async function setup(
    flags: { petActionsEnabled?: boolean; addPetEnabled?: boolean } = {},
    initialPets: Pet[] = [makePet({ id: '1' })]
  ) {
    const petsMock = createPetsStoreMock({ pets: initialPets });
    mockUsePetsStore.mockImplementation(petsMock.impl);

    const { PetList } = await import('./PetList');
    renderTestUtils(<PetList />, {
      featureFlags: {
        addPetEnabled: true,
        petActionsEnabled: true,
        ...flags,
      },
    });

    return {
      storeActions: petsMock.actions,
      getPets: () => petsMock.getState().pets,
    };
  }

  test('navigates to the new pet page when Add Pet is clicked', async () => {
    await setup();
    const addPetButton = await screen.findByTestId('add-pet-button');
    // The Add button is a Link rendered by MUI IconButton; assert it links to the correct route
    expect(addPetButton).toHaveAttribute('href', '/pets/new');
  });

  test('navigates to edit page on Edit click', async () => {
    await setup();

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    await user.click(editBtn);

    expect(navigateMock).toHaveBeenCalledWith('/pets/1/edit');
  });

  test('opens delete confirm with correct a11y, decline closes without action, confirm deletes and closes', async () => {
    const { storeActions } = await setup();

    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    await user.click(deleteBtn);

    const confirmDialog = await screen.findByRole('dialog');
    expect(confirmDialog).toBeInTheDocument();
    expect(confirmDialog).toHaveAttribute('aria-modal', 'true');

    // Accessible name provided via heading text content
    expect(screen.getByRole('heading')).toBeInTheDocument();

    // Initial focus should be on the "No" button per modal behavior
    const noBtn = screen.getByRole('button', { name: /no/i });
    expect(noBtn).toHaveFocus();

    // Decline first by keyboard (Enter)
    await user.keyboard('{Enter}');

    // Dialog appears and pressing Enter on focused No should close it immediately or soon
    // Guard: if it's still present, wait for removal; otherwise assert end-state.
    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    } else {
      expect(maybeDialog).not.toBeInTheDocument();
    }

    expect(storeActions.deletePet).not.toHaveBeenCalled();

    // Open again and confirm via Space key on Yes
    await user.click(deleteBtn);
    const dialog2 = await screen.findByRole('dialog');
    // Move focus to Yes and activate with Space; re-query within the current dialog
    const { getByRole: getByRoleInDialog2 } = within(dialog2);
    const yesBtn2 = getByRoleInDialog2('button', { name: /yes/i });
    await user.tab();
    expect(yesBtn2).toHaveFocus();
    await user.keyboard(' ');

    // Guard for synchronous/asynchronous removal
    const maybeDialog2 = screen.queryByRole('dialog');
    if (maybeDialog2) {
      await waitForElementToBeRemoved(maybeDialog2);
    } else {
      expect(maybeDialog2).not.toBeInTheDocument();
    }

    // Wait for the row to be removed (could be async via store update)
    await waitFor(() => {
      expect(
        screen.queryByRole('cell', { name: 'Fido' })
      ).not.toBeInTheDocument();
    });

    expect(storeActions.deletePet).toHaveBeenCalledWith('1');

    // Since initial list had one pet, after deletion the empty indicator should appear
    expect(await screen.findByTestId('no-pets-indicator')).toBeInTheDocument();
  });

  test('Escape closes the delete confirm without deleting', async () => {
    const { storeActions } = await setup();

    await user.click(await screen.findByRole('button', { name: /delete/i }));

    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    }

    expect(storeActions.deletePet).not.toHaveBeenCalled();
  });

  test('shows error and keeps confirm open on delete failure', async () => {
    const { storeActions } = await setup();
    storeActions.deletePet.mockRejectedValueOnce(new Error('fail'));

    await user.click(await screen.findByRole('button', { name: /delete/i }));

    const yesBtn = await screen.findByRole('button', { name: /yes/i });
    await user.click(yesBtn);

    await screen.findByRole('alert');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('does not render action buttons when petActionsEnabled=false', async () => {
    await setup({ petActionsEnabled: false });

    // Wait for the table to render to ensure we aren't checking too early
    await screen.findByRole('table');

    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  test('does not render add pet button when addPetEnabled=false', async () => {
    await setup({ addPetEnabled: false });

    // Wait for the table to render to ensure we aren't checking too early
    await screen.findByRole('table');

    expect(screen.queryByTestId('add-pet-button')).not.toBeInTheDocument();
  });

  test('shows "No Pets" indicator when user has no pets', async () => {
    await setup({}, []);

    const indicator = await screen.findByTestId('no-pets-indicator');
    expect(indicator).toBeInTheDocument();
    // Table should not be present
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // Has the label text
    expect(
      screen.getByText("You don't have any pets yet.")
    ).toBeInTheDocument();
  });

  test('indicator shows CTA link to Add Pet that navigates to /pets/new', async () => {
    await setup({ addPetEnabled: true }, []);

    const indicator = await screen.findByTestId('no-pets-indicator');
    expect(indicator).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: /add your first pet now/i });
    expect(cta).toHaveAttribute('href', '/pets/new');
  });

  test('adding first pet switches from indicator to list', async () => {
    const { storeActions } = await setup({}, []);

    // Empty state initially
    const indicator = await screen.findByTestId('no-pets-indicator');

    // Add a pet via store mock
    await act(async () => {
      await storeActions.addPet({ id: '10', name: 'Rex' } as Partial<Pet>);
    });

    // Wait for the indicator to be removed (state update + re-render)
    await waitForElementToBeRemoved(indicator);

    // Should render the table now
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});

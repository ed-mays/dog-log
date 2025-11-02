import React from 'react';
import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'; // Import screen, waitFor, and waitForElementToBeRemoved directly
import userEvent from '@testing-library/user-event';
import type { Pet } from '../types';
import { makePet } from '@testUtils/factories/makePet';
import { createPetsStoreMock } from '@testUtils/mocks/mockStores';
import { vi } from 'vitest';

// Mock the module at the top level
vi.mock('@store/pets.store', () => ({
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

  test.skip('navigates to the new pet page when Add Pet is clicked', async () => {
    //TODO: Fix this test
    await setup();
    const addPetButton = await screen.findByTestId('add-pet-button');
    await user.click(addPetButton);
    //expect(navigateMock).toHaveBeenCalledWith('/pets/new');
    expect(await screen.findByTestId('add-pet-form')).toBeInTheDocument();
  });

  test('navigates to edit page on Edit click', async () => {
    await setup();

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    await user.click(editBtn);

    expect(navigateMock).toHaveBeenCalledWith('/pets/1/edit');
  });

  test('opens delete confirm, decline closes without action, confirm deletes and closes', async () => {
    const { storeActions } = await setup();

    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    await user.click(deleteBtn);

    const confirmDialog = await screen.findByRole('dialog');
    expect(confirmDialog).toBeInTheDocument();

    // Decline first
    const noBtn = screen.getByRole('button', { name: /no/i });
    await user.click(noBtn);

    // Dialog appears and clicking No should close it immediately or very quickly
    // Guard: if it's still present, wait for removal; otherwise assert end-state.
    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    } else {
      expect(maybeDialog).not.toBeInTheDocument();
    }

    expect(storeActions.deletePet).not.toHaveBeenCalled();

    // Open again and confirm
    await user.click(deleteBtn);
    const yesBtn = screen.getByRole('button', { name: /yes/i });
    await user.click(yesBtn);

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
});

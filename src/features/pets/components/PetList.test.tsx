import React from 'react';
import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import type { Pet } from '../types';

vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

const { usePetsStore } = await import('@store/pets.store');

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod: object = await importOriginal();
  return {
    ...mod,
    useNavigate: () => navigateMock,
  };
});

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: '1',
    name: 'Fido',
    breed: 'Mix',
    birthDate: new Date('2020-01-01'),
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    createdBy: 'user1',
    isArchived: false,
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('PetList integration', () => {
  const user = userEvent.setup();

  async function setup(
    flags: { petActionsEnabled?: boolean; addPetEnabled?: boolean } = {},
    initialPets: Pet[] = [makePet()]
  ) {
    let statePets = [...initialPets];
    const storeActions = {
      updatePet: vi.fn(
        async (id: string, values: { name: string; breed: string }) => {
          statePets = statePets.map((p) =>
            p.id === id ? { ...p, ...values } : p
          );
        }
      ),
      deletePet: vi.fn(async (id: string) => {
        statePets = statePets.filter((p) => p.id !== id);
      }),
    };

    (usePetsStore as unknown as vi.Mock).mockImplementation((selector) =>
      selector({ pets: statePets, ...storeActions })
    );

    // The component now fetches pets from the store directly, so the prop is not needed.
    const { PetList } = await import('./PetList');
    render(<PetList />, {
      featureFlags: {
        addPetEnabled: true,
        petActionsEnabled: true,
        ...flags,
      },
    });

    return { storeActions, getPets: () => statePets };
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

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(storeActions.deletePet).not.toHaveBeenCalled();

    // Open again and confirm
    await user.click(deleteBtn);
    await screen.findByRole('dialog');
    const yesBtn = screen.getByRole('button', { name: /yes/i });
    await user.click(yesBtn);

    await waitFor(() => {
      expect(storeActions.deletePet).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      // The component re-renders from the store, so we check the UI
      expect(
        screen.queryByRole('cell', { name: 'Fido' })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).toBeNull();
    });
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

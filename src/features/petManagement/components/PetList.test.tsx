import React from 'react';
import { render, screen, fireEvent, waitFor } from '@test-utils';
import { PetList } from './PetList';
import type { Pet } from '../types';

vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

const { usePetsStore } = await import('@store/pets.store');

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
  function setup(
    flags: { petActionsEnabled?: boolean } = { petActionsEnabled: true }
  ) {
    let statePets = [makePet()];
    const actions = {
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

    (usePetsStore as unknown as vi.Mock).mockImplementation((selector: any) =>
      selector({ pets: statePets, ...actions })
    );

    render(<PetList pets={statePets} />, {
      featureFlags: { addPetEnabled: true, ...flags },
    });

    return { actions, getPets: () => statePets };
  }

  it('opens edit modal on Edit click, pre-populates fields, submits and updates list', async () => {
    const { actions } = setup();

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const breedInput = screen.getByLabelText(/breed/i) as HTMLInputElement;

    expect(nameInput.value).toBe('Fido');
    expect(breedInput.value).toBe('Mix');

    fireEvent.change(nameInput, { target: { value: 'Rex' } });

    const submitBtn = screen.getByRole('button', { name: /ok/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(actions.updatePet).toHaveBeenCalledWith('1', {
        name: 'Rex',
        breed: 'Mix',
      });
    });

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // List updates
    expect(screen.getByText('Rex')).toBeInTheDocument();
  });

  it('cancel closes edit modal without calling service', async () => {
    const { actions } = setup();

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(actions.updatePet).not.toHaveBeenCalled();
  });

  it('opens delete confirm, decline closes without action, confirm deletes and closes', async () => {
    const { actions } = setup();

    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    const confirmDialog = await screen.findByRole('dialog');
    expect(confirmDialog).toBeInTheDocument();

    // Decline first
    const noBtn = screen.getByRole('button', { name: /no/i });
    fireEvent.click(noBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(actions.deletePet).not.toHaveBeenCalled();

    // Open again and confirm
    fireEvent.click(deleteBtn);
    await screen.findByRole('dialog');
    const yesBtn = screen.getByRole('button', { name: /yes/i });
    fireEvent.click(yesBtn);

    await waitFor(() => {
      expect(actions.deletePet).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.queryByText('Fido')).toBeNull();
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('shows error and keeps edit modal open on update failure', async () => {
    const { actions } = setup();
    actions.updatePet.mockRejectedValueOnce(new Error('fail'));
    fireEvent.click(await screen.findByRole('button', { name: /edit/i }));

    const nameInput = await screen.findByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Buddy' } });
    fireEvent.click(screen.getByRole('button', { name: /ok/i }));

    await screen.findByRole('alert');
    // Dialog should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows error and keeps confirm open on delete failure', async () => {
    const { actions } = setup();
    actions.deletePet.mockRejectedValueOnce(new Error('fail'));

    fireEvent.click(await screen.findByRole('button', { name: /delete/i }));

    const yesBtn = await screen.findByRole('button', { name: /yes/i });
    fireEvent.click(yesBtn);

    await screen.findByRole('alert');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render action buttons when petActionsEnabled=false', async () => {
    setup({ petActionsEnabled: false });

    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });
});

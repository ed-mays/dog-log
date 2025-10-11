import React from 'react';
import { render, screen, fireEvent, waitFor } from '@test-utils';
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
  async function setup(
    flags: { petActionsEnabled?: boolean } = { petActionsEnabled: true },
    options: { renderList?: boolean } = {}
  ) {
    const { renderList = true } = options;
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

    if (renderList) {
      const { PetList } = await import('./PetList');
      render(<PetList pets={statePets} />, {
        featureFlags: { addPetEnabled: true, ...flags },
      });
    }

    return { actions, getPets: () => statePets };
  }

  it('navigates to edit page on Edit click', async () => {
    await setup({}, { renderList: false });

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: any = await importOriginal();
      return { ...mod, useNavigate: () => navSpy };
    });
    // Import after mocking to pick up mocked navigate
    const { PetList: MockedPetList } = await import('./PetList');
    render(<MockedPetList pets={[makePet()]} />, {
      featureFlags: { addPetEnabled: true, petActionsEnabled: true },
    });

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    expect(navSpy).toHaveBeenCalledWith('/pets/1/edit');
  });

  it('opens delete confirm, decline closes without action, confirm deletes and closes', async () => {
    const { actions } = await setup();

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

  it('shows error and keeps confirm open on delete failure', async () => {
    const { actions } = await setup();
    actions.deletePet.mockRejectedValueOnce(new Error('fail'));

    fireEvent.click(await screen.findByRole('button', { name: /delete/i }));

    const yesBtn = await screen.findByRole('button', { name: /yes/i });
    fireEvent.click(yesBtn);

    await screen.findByRole('alert');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render action buttons when petActionsEnabled=false', async () => {
    await setup({ petActionsEnabled: false });

    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });
});

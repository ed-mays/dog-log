import React from 'react';
import { render, screen, fireEvent, waitFor } from '@test-utils';
import type { Pet } from '@features/petManagement/types';

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
  } as Pet;
}

describe('EditPetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('renders existing pet and submits updates then navigates to /pets', async () => {
    const statePets = [makePet()];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    (usePetsStore as unknown as vi.Mock).mockImplementation((selector) =>
      selector({ pets: statePets, ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: EditPetPage } = await import('./EditPetPage');
    render(<EditPetPage />);

    const nameInput = await screen.findByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Buddy' } });
    fireEvent.click(screen.getByRole('button', { name: /ok/i }));

    await waitFor(() => {
      expect(actions.updatePet).toHaveBeenCalledWith('1', {
        name: 'Buddy',
        breed: 'Mix',
      });
      expect(navSpy).toHaveBeenCalledWith('/pets');
    });
  });

  it('cancel navigates back to /pets', async () => {
    const statePets = [makePet()];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    (usePetsStore as unknown as vi.Mock).mockImplementation((selector) =>
      selector({ pets: statePets, ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: EditPetPage } = await import('./EditPetPage');
    render(<EditPetPage />);

    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(navSpy).toHaveBeenCalledWith('/pets');
    });
    expect(actions.updatePet).not.toHaveBeenCalled();
  });

  it('shows not found when pet id is invalid', async () => {
    const statePets: Pet[] = [];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    (usePetsStore as unknown as vi.Mock).mockImplementation((selector) =>
      selector({ pets: statePets, ...actions })
    );

    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: 'nope' }),
        useNavigate: () => vi.fn(),
      };
    });

    const { default: EditPetPage } = await import('./EditPetPage');
    render(<EditPetPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i);
  });

  it('shows confirm modal on cancel when form is dirty; decline closes without navigation', async () => {
    const statePets = [makePet()];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    (usePetsStore as unknown as vi.Mock).mockImplementation((selector) =>
      selector({ pets: statePets, ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: EditPetPage } = await import('./EditPetPage');
    render(<EditPetPage />);

    const nameInput = await screen.findByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Buddy' } });

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    // Confirm modal appears
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Click No (decline)
    const noBtn = screen.getByRole('button', { name: /no/i });
    fireEvent.click(noBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(navSpy).not.toHaveBeenCalled();
    expect(actions.updatePet).not.toHaveBeenCalled();
  });

  it('accepting confirm after dirty cancel navigates back to /pets', async () => {
    const statePets = [makePet()];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    (usePetsStore as unknown as vi.Mock).mockImplementation((selector) =>
      selector({ pets: statePets, ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: EditPetPage } = await import('./EditPetPage');
    render(<EditPetPage />);

    const nameInput = await screen.findByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Buddy' } });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await screen.findByRole('dialog');

    // Click Yes (accept)
    const yesBtn = screen.getByRole('button', { name: /yes/i });
    fireEvent.click(yesBtn);

    await waitFor(() => {
      expect(navSpy).toHaveBeenCalledWith('/pets');
    });
    expect(actions.updatePet).not.toHaveBeenCalled();
  });
});

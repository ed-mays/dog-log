import React from 'react';
import { render, screen, waitFor } from '@test-utils';
import { waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Pet } from '@features/pets/types';
import { vi } from 'vitest';

// Mock the module at the top level
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

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
  let mockUsePetsStore: vi.Mock;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Dynamically import the mocked module after resetModules
    const petsStoreModule = await import('@store/pets.store');
    mockUsePetsStore = petsStoreModule.usePetsStore as vi.Mock;
  });

  it('renders existing pet and submits updates then navigates to /pets', async () => {
    const statePets = [makePet()];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
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

    const user = userEvent.setup();
    const nameInput = await screen.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Buddy');
    await user.click(screen.getByRole('button', { name: /ok/i }));

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
    mockUsePetsStore.mockImplementation((selector) =>
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
    const user = userEvent.setup();
    await user.click(cancelBtn);

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
    mockUsePetsStore.mockImplementation((selector) =>
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

  it('shows confirm modal on cancel when form is dirty; has correct a11y and decline closes without navigation', async () => {
    const statePets = [makePet()];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
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
    const user = userEvent.setup();
    render(<EditPetPage />);

    const nameInput = await screen.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Buddy');

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    // Confirm modal appears with correct ARIA
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Accessible name/heading inside the dialog
    const { getByRole: getByRoleInDialog } = within(dialog);
    expect(getByRoleInDialog('heading')).toBeInTheDocument();

    // Initial focus on No; press Enter to decline
    const noBtn = screen.getByRole('button', { name: /no/i });
    expect(noBtn).toHaveFocus();
    await user.keyboard('{Enter}');

    // Guard for sync/async removal of the dialog
    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    } else {
      expect(maybeDialog).not.toBeInTheDocument();
    }

    expect(navSpy).not.toHaveBeenCalled();
    expect(actions.updatePet).not.toHaveBeenCalled();
  });

  it('accepting confirm after dirty cancel navigates back to /pets', async () => {
    const statePets = [makePet()];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
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
    const user = userEvent.setup();
    render(<EditPetPage />);

    const nameInput = await screen.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Buddy');

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await screen.findByRole('dialog');

    // Move focus to Yes (Tab) and press Space to accept
    await user.tab();
    const yesBtn = screen.getByRole('button', { name: /yes/i });
    expect(yesBtn).toHaveFocus();
    await user.keyboard(' ');

    // Guard for sync/async removal of the dialog
    const maybeDialog2 = screen.queryByRole('dialog');
    if (maybeDialog2) {
      await waitForElementToBeRemoved(maybeDialog2);
    } else {
      expect(maybeDialog2).not.toBeInTheDocument();
    }

    await waitFor(() => {
      expect(navSpy).toHaveBeenCalledWith('/pets');
    });
    expect(actions.updatePet).not.toHaveBeenCalled();
  });

  it('Escape closes the confirm modal without navigating', async () => {
    const statePets = [makePet()];
    const actions = {
      updatePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
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
    const user = userEvent.setup();
    render(<EditPetPage />);

    const nameInput = await screen.findByLabelText(/name/i);
    await user.type(nameInput, 'X');

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    }

    expect(navSpy).not.toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@test-utils';
import { waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Pet } from '@features/pets/types';
import { vi } from 'vitest';
import { installPetsStoreMock } from '@testUtils/mocks/mockStoreInstallers';

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
  beforeEach(() => {
    vi.resetAllMocks();
  });

  async function setup(
    options: {
      petId?: string;
      pets?: Pet[];
      storeOverrides?: Record<string, unknown>;
    } = {}
  ) {
    const { petId = '1', pets = [makePet()], storeOverrides } = options;

    // Ensure a fresh module graph for per-test vi.doMock hooks
    vi.resetModules();

    const petsMock = installPetsStoreMock({ pets, ...storeOverrides });

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: petId }),
        useNavigate: () => navSpy,
      };
    });

    const { default: EditPetPage } = await import('./EditPetPage');
    const { render } = await import('@test-utils');
    const user = userEvent.setup();
    return { petsMock, navSpy, EditPetPage, render, user };
  }

  it('renders existing pet and submits updates then navigates to /pets', async () => {
    const { petsMock, navSpy, EditPetPage, render, user } = await setup();

    render(<EditPetPage />);

    const nameInput = await screen.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Buddy');
    await user.click(screen.getByRole('button', { name: /ok/i }));

    await waitFor(() => {
      expect(petsMock.actions.updatePet).toHaveBeenCalledWith('1', {
        name: 'Buddy',
        breed: 'Mix',
      });
      expect(navSpy).toHaveBeenCalledWith('/pets');
    });
  });

  it('cancel navigates back to /pets', async () => {
    const { petsMock, navSpy, EditPetPage, render, user } = await setup();

    render(<EditPetPage />);

    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(navSpy).toHaveBeenCalledWith('/pets');
    });
    expect(petsMock.actions.updatePet).not.toHaveBeenCalled();
  });

  it('shows not found when pet id is invalid', async () => {
    const { EditPetPage, render } = await setup({ petId: 'nope', pets: [] });

    render(<EditPetPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i);
  });

  it('shows confirm modal on cancel when form is dirty; has correct a11y and decline closes without navigation', async () => {
    const { petsMock, navSpy, EditPetPage, render, user } = await setup();

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
    expect(petsMock.actions.updatePet).not.toHaveBeenCalled();
  });

  it('accepting confirm after dirty cancel navigates back to /pets', async () => {
    const { petsMock, navSpy, EditPetPage, render, user } = await setup();

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
    expect(petsMock.actions.updatePet).not.toHaveBeenCalled();
  });

  it('Escape closes the confirm modal without navigating', async () => {
    const { navSpy, EditPetPage, render, user } = await setup();

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
  it('shows error message when update fails and stops saving', async () => {
    // Arrange pets store with a failing updatePet
    const pets = [makePet()];
    const failingUpdate = vi.fn(async () => {
      throw new Error('update failed');
    });
    installPetsStoreMock({ pets, updatePet: failingUpdate });

    // Mock router hooks for this test case
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    // Dynamically import after mocks are in place
    const { default: EditPetPage } = await import('./EditPetPage');

    const user = userEvent.setup();
    render(<EditPetPage />);

    // Act
    const nameInput = await screen.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Buddy');

    await user.click(screen.getByRole('button', { name: /ok/i }));

    // Assert: error alert appears and saving indicator is not present
    const err = await screen.findByTestId('edit-pet-error');
    expect(err).toHaveTextContent(/update/i);
    expect(screen.queryByTestId('edit-pet-saving')).not.toBeInTheDocument();

    // And no navigation on failure
    expect(navSpy).not.toHaveBeenCalled();
  });
});

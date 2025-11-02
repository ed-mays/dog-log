import {
  screen,
  within,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { render } from '@test-utils';
import { createPetsStoreMock } from '@testUtils/mocks/mockStores';

// ADR-019 Per-Test Variation Pattern
// - We use vi.resetModules() in beforeEach and set up vi.doMock(...) for
//   dependencies before dynamically importing the component under test.
// - No top-level import of AddPetPage or the real store module.

describe('AddPetPage', () => {
  let petsMock: ReturnType<typeof createPetsStoreMock>;
  let mockNavigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Ensure no lingering per-test mocks from previous tests
    vi.unmock('@features/pets/components/PetForm');
    vi.unmock('@features/pets/components/PetForm.tsx');

    // Prepare store mock instance for this test run
    petsMock = createPetsStoreMock();

    // Mock the pets store for this module load
    vi.doMock('@store/pets.store', () => ({
      // Expose the mocked hook implementation; unknown avoids explicit any
      usePetsStore: petsMock.impl as unknown,
    }));

    // Mock react-router's useNavigate for this module load
    mockNavigate = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const actual = await importOriginal<{ [key: string]: unknown }>();
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });
  });

  it('renders the PetForm', async () => {
    const module = await import('./AddPetPage');
    const AddPetPage = module.default;

    render(<AddPetPage />);
    expect(await screen.findByText('OK')).toBeInTheDocument();
    expect(await screen.findByText('Cancel')).toBeInTheDocument();
  });

  // TODO: Fix this test
  // it('submits form, adds pet to store, navigates to /pets', async () => {
  //   const module = await import('./AddPetPage');
  //   const AddPetPage = module.default;
  //   render(<AddPetPage />);
  //
  //   const nameInput = await screen.findByLabelText('Name');
  //   const breedInput = await screen.findByLabelText('Breed');
  //
  //   nameInput.textContent = testPet.name;
  //   breedInput.textContent = testPet.breed;
  //   fireEvent.click(await screen.findByText('OK'));
  //
  //   await waitFor(() => {
  //     expect(addPetMock).toHaveBeenCalledWith({
  //       name: 'Rover',
  //       breed: 'Hound',
  //       birthDate: testBirthDate,
  //     });
  //   });
  //
  //   await waitFor(() => {
  //     expect(mockNavigate).toHaveBeenCalledWith('/pets');
  //   });
  // });

  // TODO: Fix this test
  // it('shows modal when cancel is clicked if dirty, then accepts and navigates', async () => {
  //   const module = await import('./AddPetPage');
  //   const AddPetPage = module.default;
  //   render(<AddPetPage />);
  //   fireEvent.click(await screen.findByText('Cancel'));
  //   expect(await screen.findByText('OK')).toBeInTheDocument();
  //   expect(await screen.findByText('Cancel')).toBeInTheDocument();
  //   fireEvent.click(await screen.findByText('OK'));
  //   expect(mockNavigate).toHaveBeenCalledWith('/pets');
  // });

  // TODO: Fix this test
  // it('shows modal on cancel if dirty, declines and stays on page', async () => {
  //   const module = await import('./AddPetPage');
  //   const AddPetPage = module.default;
  //   render(<AddPetPage />);
  //   const nameInput = await screen.findByLabelText('Name');
  //   nameInput.textContent = testPet.name;
  //   fireEvent.click(await screen.findByText('Cancel'));
  //   fireEvent.click(await screen.findByText('Decline'));
  //   expect(mockNavigate).not.toHaveBeenCalled();
  // });

  it('navigates away immediately if cancel is activated (click or keyboard) and not dirty', async () => {
    // Provide a per-test mock of the PetForm that only renders a Cancel button
    vi.doMock('@features/pets/components/PetForm', () => ({
      PetForm: (props: { onCancel: () => void }) => (
        <div>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
      ),
    }));

    const module = await import('./AddPetPage');
    const AddPetPage = module.default;

    const user = userEvent.setup();
    render(<AddPetPage />);

    const cancel = await screen.findByRole('button', { name: /cancel/i });

    // Activate via keyboard (Enter)
    cancel.focus();
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/pets');

    // Clear and also verify mouse click path
    mockNavigate.mockClear();
    await user.click(cancel);
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });

  it('opens confirm on dirty cancel with correct a11y; focus, trap, and Escape close without navigation', async () => {
    // Provide a minimal PetForm that can toggle dirty state and trigger cancel
    vi.doMock('@features/pets/components/PetForm', () => ({
      PetForm: (props: {
        onCancel: () => void;
        onDirtyChange: (v: boolean) => void;
      }) => (
        <div>
          <button onClick={() => props.onDirtyChange(true)}>Make Dirty</button>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
      ),
    }));

    const module = await import('./AddPetPage');
    const AddPetPage = module.default;

    const user = userEvent.setup();
    render(<AddPetPage />);

    // Make form dirty via explicit control
    await userEvent.click(
      await screen.findByRole('button', { name: /make dirty/i })
    );

    // Click Cancel to open confirm dialog
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Heading provides the accessible name inside dialog
    expect(within(dialog).getByRole('heading')).toBeInTheDocument();

    const noBtn = within(dialog).getByRole('button', { name: /no/i });
    const yesBtn = within(dialog).getByRole('button', { name: /yes/i });

    // Initial focus on No
    expect(noBtn).toHaveFocus();

    // Focus trap: Tab to Yes, Shift+Tab back to No
    await user.tab();
    expect(yesBtn).toHaveFocus();
    await user.tab({ shift: true });
    expect(noBtn).toHaveFocus();

    // Escape closes without navigation
    await user.keyboard('{Escape}');
    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    }
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('accepts dirty cancel via keyboard: Tab to Yes and Space to confirm; navigates to /pets', async () => {
    // Provide a minimal PetForm that can toggle dirty state and trigger cancel
    vi.doMock('@features/pets/components/PetForm', () => ({
      PetForm: (props: {
        onCancel: () => void;
        onDirtyChange: (v: boolean) => void;
      }) => (
        <div>
          <button onClick={() => props.onDirtyChange(true)}>Make Dirty</button>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
      ),
    }));

    const module = await import('./AddPetPage');
    const AddPetPage = module.default;

    const user = userEvent.setup();
    render(<AddPetPage />);

    // Make form dirty via explicit control
    await user.click(
      await screen.findByRole('button', { name: /make dirty/i })
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    const dialog = await screen.findByRole('dialog');

    // Move focus to Yes and activate with Space
    await user.tab();
    const yesBtn = within(dialog).getByRole('button', { name: /yes/i });
    expect(yesBtn).toHaveFocus();
    await user.keyboard(' ');

    // Guard for async removal and assert navigation
    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    }
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });
});

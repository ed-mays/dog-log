import {
  screen,
  within,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { installPetsStoreMock } from '@testUtils/mocks/mockStoreInstallers';

// Mock the pets store hook at module level; installer will provide impl per-test
vi.mock('@store/pets.store', () => ({ usePetsStore: vi.fn() }));

// ADR-019 Per-Test Variation Pattern
// - We use vi.resetModules() in beforeEach and set up vi.doMock(...) for
//   dependencies before dynamically importing the component under test.
// - No top-level import of AddPetPage or the real store module.

describe('AddPetPage', () => {
  let petsMock: ReturnType<typeof installPetsStoreMock>;
  let mockNavigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules();

    // Ensure no lingering per-test mocks from previous tests
    vi.unmock('@features/pets/components/PetForm');

    // Install selector-compatible pets store mock for this test run
    petsMock = installPetsStoreMock();

    // Mock react-router's useNavigate for this module load on a fresh graph
    mockNavigate = vi.fn();
    vi.doMock('react-router-dom', async () => {
      const actual =
        await vi.importActual<typeof import('react-router-dom')>(
          'react-router-dom'
        );
      return { ...actual, useNavigate: () => mockNavigate };
    });
  });

  async function renderWithProviders(
    ui: React.ReactElement,
    options?: Record<string, unknown>
  ) {
    const { render } = await import('@test-utils');
    return render(ui, options as never);
  }

  it('renders the PetForm', async () => {
    const module = await import('./AddPetPage');
    const AddPetPage = module.default;

    await renderWithProviders(<AddPetPage />);
    expect(await screen.findByText('OK')).toBeInTheDocument();
    expect(await screen.findByText('Cancel')).toBeInTheDocument();
  });

  it('submits form, adds pet to store, then navigates to /pets', async () => {
    // Mock PetForm to submit a known Pet payload when clicking OK
    vi.doMock('@features/pets/components/PetForm', () => ({
      PetForm: (props: {
        onSubmit: (pet: unknown) => void | Promise<void>;
      }) => {
        const testBirthDate = new Date('2020-01-02T00:00:00.000Z');
        const testPet = {
          name: 'Rover',
          breed: 'Hound',
          birthDate: testBirthDate,
        };
        return (
          <div>
            <button onClick={() => props.onSubmit(testPet)}>OK</button>
          </div>
        );
      },
    }));

    const module = await import('./AddPetPage');
    const AddPetPage = module.default;

    const user = userEvent.setup();
    await renderWithProviders(<AddPetPage />);

    await user.click(await screen.findByRole('button', { name: /ok/i }));

    // Assert store action was called with expected subset
    expect(petsMock.actions.addPet).toHaveBeenCalledTimes(1);
    const arg = petsMock.actions.addPet.mock.calls[0][0];
    expect(arg).toMatchObject({ name: 'Rover', breed: 'Hound' });
    expect(arg.birthDate).toBeInstanceOf(Date);

    // After submit, navigate to /pets
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });

  it('shows confirm when dirty cancel is clicked, then accepts and navigates', async () => {
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
    await renderWithProviders(<AddPetPage />);

    // Make form dirty and click Cancel
    await user.click(
      await screen.findByRole('button', { name: /make dirty/i })
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Confirm modal appears with Yes/No
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: /yes/i })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /no/i })
    ).toBeInTheDocument();

    // Click Yes to accept
    await user.click(within(dialog).getByRole('button', { name: /yes/i }));

    // Wait for dialog to go away and assert navigation
    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    }
    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });

  it('shows confirm on dirty cancel, declines and stays on page', async () => {
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
    await renderWithProviders(<AddPetPage />);

    // Make form dirty and click Cancel
    await user.click(
      await screen.findByRole('button', { name: /make dirty/i })
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Confirm modal appears with Yes/No
    const dialog = await screen.findByRole('dialog');
    const noBtn = within(dialog).getByRole('button', { name: /no/i });

    // Click No to decline
    await user.click(noBtn);

    // Dialog should close and no navigation should have occurred
    const maybeDialog = screen.queryByRole('dialog');
    if (maybeDialog) {
      await waitForElementToBeRemoved(maybeDialog);
    }
    expect(mockNavigate).not.toHaveBeenCalled();
  });

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
    await renderWithProviders(<AddPetPage />);

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
    await renderWithProviders(<AddPetPage />);

    // Make form dirty via explicit control
    await user.click(
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
    await renderWithProviders(<AddPetPage />);

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

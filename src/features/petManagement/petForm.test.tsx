import { screen, fireEvent } from '@testing-library/react';
import { PetForm } from './PetForm';
import type { Pet } from './PetForm';
import { render } from 'test-utils.tsx';

describe('PetForm', () => {
  const initialPet: Pet = { name: '', breed: '' };
  let onSubmit: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;
  let setDirty: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onCancel = vi.fn();
    setDirty = vi.fn();
  });

  function renderForm(vals = initialPet) {
    render(
      <PetForm
        initialValues={vals}
        onSubmit={onSubmit}
        onCancel={onCancel}
        setDirty={setDirty}
      />
    );
  }

  it('renders name and breed inputs', () => {
    renderForm();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/breed/i)).toBeInTheDocument();
  });

  it('disables OK when form is invalid', () => {
    renderForm();
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('enables OK when inputs are filled', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Fido', name: 'name' },
    });
    fireEvent.change(screen.getByLabelText(/breed/i), {
      target: { value: 'Beagle', name: 'breed' },
    });
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).not.toBeDisabled();
  });

  it('calls onSubmit with pet data and disables on invalid', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Rex', name: 'name' },
    });
    fireEvent.change(screen.getByLabelText(/breed/i), {
      target: { value: 'Lab', name: 'breed' },
    });
    const okButton = screen.getByRole('button', { name: /ok/i });
    fireEvent.click(okButton);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Rex', breed: 'Lab' });
  });

  it('calls onCancel when Cancel is clicked', () => {
    renderForm();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls setDirty(true) when form is modified, setDirty(false) when reverted', () => {
    renderForm({ name: 'A', breed: 'B' });
    const nameInput = screen.getByLabelText(/name/i);

    // Change to something else
    fireEvent.change(nameInput, { target: { value: 'Alice', name: 'name' } });
    expect(setDirty).toHaveBeenLastCalledWith(true);

    // Change back to original
    fireEvent.change(nameInput, { target: { value: 'A', name: 'name' } });
    expect(setDirty).toHaveBeenLastCalledWith(false);
  });
});

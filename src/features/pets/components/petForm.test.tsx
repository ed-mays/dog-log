import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PetForm } from './PetForm';
import type { Pet } from './PetForm';
import { render, withLocale } from '@test-utils';

describe('PetForm', () => {
  const initialPet: Pet = { name: '', breed: '' };

  // Use vi.fn() for all mocks (Vitest)
  let onSubmit: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;
  let onDirtyChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onCancel = vi.fn();
    onDirtyChange = vi.fn();
  });

  function renderForm(vals: Pet = initialPet) {
    render(
      <PetForm
        initialValues={vals}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  it('renders the correct (English) labels and buttons', async () => {
    renderForm(initialPet);
    expect(await screen.findByLabelText('Name')).toBeInTheDocument();
    expect(await screen.findByLabelText('Breed')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'OK' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Cancel' })
    ).toBeInTheDocument();
  });

  it('renders the correct (Spanish) labels and buttons', async () => {
    await withLocale('es', async () => {
      renderForm(initialPet);
      expect(await screen.findByLabelText('Nombre')).toBeInTheDocument();
      expect(await screen.findByLabelText('Raza')).toBeInTheDocument();
      expect(
        await screen.findByRole('button', { name: 'Aceptar' })
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('button', { name: 'Cancelar' })
      ).toBeInTheDocument();
    });
  });

  it('marks inputs as required and associates labels correctly', async () => {
    renderForm();
    const nameInput = await screen.findByLabelText(/name/i);
    const breedInput = await screen.findByLabelText(/breed/i);
    expect(nameInput).toBeRequired();
    expect(breedInput).toBeRequired();
  });

  it('disables OK when form is invalid', async () => {
    renderForm();
    const okButton = await screen.findByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('enables OK when inputs are filled', async () => {
    renderForm();
    await userEvent.type(await screen.findByLabelText(/name/i), 'Fido');
    await userEvent.type(await screen.findByLabelText(/breed/i), 'Beagle');
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeEnabled();
  });

  it('submits with Enter key from an input when valid', async () => {
    renderForm();
    const nameInput = await screen.findByLabelText(/name/i);
    const breedInput = await screen.findByLabelText(/breed/i);
    await userEvent.type(nameInput, 'Rex');
    await userEvent.type(breedInput, 'Lab');

    // Press Enter while focused in input should submit the form
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Rex', breed: 'Lab' });
  });

  it('calls onSubmit with pet data when clicking OK', async () => {
    renderForm();
    await userEvent.type(await screen.findByLabelText(/name/i), 'Rex');
    await userEvent.type(await screen.findByLabelText(/breed/i), 'Lab');
    const okButton = await screen.findByRole('button', { name: /ok/i });
    await userEvent.click(okButton);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Rex', breed: 'Lab' });
  });

  it('calls onCancel when Cancel is clicked or activated via keyboard', async () => {
    renderForm();
    const cancelButton = await screen.findByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);

    // Focus and activate via keyboard
    cancelButton.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it('calls onDirtyChange(true) when form is modified, onDirtyChange(false) when reverted', async () => {
    renderForm({ name: 'A', breed: 'B' });
    const nameInput = await screen.findByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Alice');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'A');
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it('supports controlled mode with value/onChange', async () => {
    const ControlledHost = () => {
      const [val, setVal] = useState<Pet>({ name: '', breed: '' });
      return (
        <PetForm
          initialValues={{ name: '', breed: '' }}
          value={val}
          onChange={setVal}
          onSubmit={onSubmit}
          onCancel={onCancel}
          onDirtyChange={onDirtyChange}
        />
      );
    };

    render(<ControlledHost />);
    await userEvent.type(await screen.findByLabelText(/name/i), 'Fido');
    await userEvent.type(await screen.findByLabelText(/breed/i), 'Beagle');
    const okButton = await screen.findByRole('button', { name: /ok/i });
    expect(okButton).toBeEnabled();
    await userEvent.click(okButton);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Fido', breed: 'Beagle' });
  });
});

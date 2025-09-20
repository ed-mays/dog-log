import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PetForm } from './PetForm';
import type { Pet } from './PetForm';
import { render } from '@/test-utils';
import i18n from '@testUtils/test-i18n';

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

  function renderForm(vals: Pet = initialPet, lng: 'en' | 'es' = 'en') {
    i18n.changeLanguage(lng);
    render(
      <PetForm
        initialValues={vals}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  it('renders the correct (English) labels and buttons', () => {
    renderForm(initialPet, 'en');
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Breed')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders the correct (Spanish) labels and buttons', () => {
    renderForm(initialPet, 'es');
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Raza')).toBeInTheDocument();
    expect(screen.getByText('Aceptar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('disables OK when form is invalid', () => {
    renderForm();
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('enables OK when inputs are filled', async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/name/i), 'Fido');
    await userEvent.type(screen.getByLabelText(/breed/i), 'Beagle');
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).not.toBeDisabled();
  });

  it('calls onSubmit with pet data and disables on invalid', async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/name/i), 'Rex');
    await userEvent.type(screen.getByLabelText(/breed/i), 'Lab');
    const okButton = screen.getByRole('button', { name: /ok/i });
    await userEvent.click(okButton);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Rex', breed: 'Lab' });
  });

  it('calls onCancel when Cancel is clicked', async () => {
    renderForm();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onDirtyChange(true) when form is modified, onDirtyChange(false) when reverted', async () => {
    renderForm({ name: 'A', breed: 'B' });
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Alice');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'A');
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });
});

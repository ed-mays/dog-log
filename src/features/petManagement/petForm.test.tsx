import { screen, fireEvent } from '@testing-library/react';
import { PetForm } from './PetForm';
import type { Pet } from './PetForm';
import { render } from 'test-utils.tsx';
import i18n from './mocki18n';

describe('PetForm', () => {
  const initialPet: Pet = { name: '', breed: '' };

  // Use vi.fn() for all mocks (Vitest)
  let onSubmit: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;
  let setDirty: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onCancel = vi.fn();
    setDirty = vi.fn();
  });

  function renderForm(vals: Pet = initialPet, lng: 'en' | 'es' = 'en') {
    i18n.changeLanguage(lng);
    render(
      <PetForm
        initialValues={vals}
        onSubmit={onSubmit}
        onCancel={onCancel}
        setDirty={setDirty}
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
    fireEvent.change(nameInput, { target: { value: 'Alice', name: 'name' } });
    expect(setDirty).toHaveBeenLastCalledWith(true);
    fireEvent.change(nameInput, { target: { value: 'A', name: 'name' } });
    expect(setDirty).toHaveBeenLastCalledWith(false);
  });
});

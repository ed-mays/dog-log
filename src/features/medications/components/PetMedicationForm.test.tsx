import { describe, it, expect, vi, beforeEach } from 'vitest';
// eslint-disable-next-line no-restricted-imports
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PetMedicationForm } from './PetMedicationForm';
import {
  usePetMedicationStore,
  type PetMedicationState,
} from '@store/usePetMedicationStore';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('@store/usePetMedicationStore');

// Mock MedicationCatalogDialog to simplify testing
vi.mock('./MedicationCatalogDialog', () => ({
  MedicationCatalogDialog: ({
    open,
    onSelect,
  }: {
    open: boolean;
    onSelect: (med: unknown) => void;
  }) =>
    open ? (
      <div role="dialog">
        <button
          onClick={() =>
            onSelect({
              id: 'med-1',
              name: 'Aspirin',
              defaultForm: 'pill',
              defaultRoute: 'oral',
            })
          }
        >
          Select Aspirin
        </button>
      </div>
    ) : null,
}));

describe('PetMedicationForm', () => {
  const mockOnCancel = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockAddPetMedication = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePetMedicationStore).mockReturnValue({
      addPetMedication: mockAddPetMedication,
      isLoading: false,
    } as unknown as PetMedicationState);
  });

  it('should render form elements', () => {
    render(
      <PetMedicationForm
        petId="pet-1"
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Add Medication')).toBeInTheDocument();
    expect(screen.getByText('Select Medication')).toBeInTheDocument();
  });

  it('should select a medication from catalog', async () => {
    const user = userEvent.setup();
    render(
      <PetMedicationForm
        petId="pet-1"
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );

    await user.click(screen.getByText('Select Medication'));
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.click(screen.getByText('Select Aspirin'));

    expect(await screen.findByText('Aspirin')).toBeInTheDocument();
    expect(
      await screen.findByRole('spinbutton', { name: /Dose Amount/i })
    ).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <PetMedicationForm
        petId="pet-1"
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );

    // Select medication
    await user.click(screen.getByText('Select Medication'));
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.click(screen.getByText('Select Aspirin'));

    // Fill form
    const doseInput = await screen.findByRole('spinbutton', {
      name: /Dose Amount/i,
    });
    await user.clear(doseInput);
    await user.type(doseInput, '2');

    // MUI Selects are tricky, let's assume defaults for now or test if needed
    // The default unit is 'tablet' and schedule is 'onceDaily'

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeEnabled();

    // Try submitting the form directly
    const form = screen.getByRole('form');
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockAddPetMedication).toHaveBeenCalled();
    });
  });

  it('should handle custom label and field changes', async () => {
    const user = userEvent.setup();
    render(
      <PetMedicationForm
        petId="pet-1"
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );

    // Select medication
    await user.click(screen.getByText('Select Medication'));
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.click(screen.getByText('Select Aspirin'));

    // Custom Label
    const customLabelInput = screen.getByLabelText(/Custom Label/i);
    await user.type(customLabelInput, 'My Meds');

    // Change Unit
    // MUI Select is hard to test with userEvent sometimes, using fireEvent on the hidden input or finding the option
    // For simplicity with MUI Select, we often just check if the element exists and we can interact
    // Let's try to find the select by the current value 'Tablet'
    const unitSelect = screen.getByText('Tablet');
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.mouseDown(unitSelect);
    const mlOption = await screen.findByText('mL');
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.click(mlOption);

    // Submit
    const form = screen.getByRole('form');
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockAddPetMedication).toHaveBeenCalledWith(
        'pet-1',
        expect.objectContaining({
          customLabel: 'My Meds',
          doseUnit: 'mL',
        })
      );
    });
  });

  it('should handle all field updates', async () => {
    const user = userEvent.setup();
    render(
      <PetMedicationForm
        petId="pet-1"
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );

    // Select medication
    await user.click(screen.getByText('Select Medication'));
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.click(screen.getByText('Select Aspirin'));

    // Update Dose Amount
    const doseInput = await screen.findByRole('spinbutton', {
      name: /Dose Amount/i,
    });
    await user.clear(doseInput);
    await user.type(doseInput, '5');

    // Update Schedule
    const scheduleSelect = screen.getByText('Once Daily');
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.mouseDown(scheduleSelect);
    const twiceDailyOption = await screen.findByText('Twice Daily');
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.click(twiceDailyOption);

    // Update Start Date
    const dateInput = screen.getByLabelText(/Start Date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2023-01-01');

    // Submit
    const form = screen.getByRole('form');
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockAddPetMedication).toHaveBeenCalledWith(
        'pet-1',
        expect.objectContaining({
          doseAmount: 5,
          scheduleType: 'twiceDaily',
          scheduleConfig: {
            startDate: '2023-01-01',
          },
        })
      );
    });
  });

  it('should handle submission error', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAddPetMedication.mockRejectedValue(new Error('Failed to add'));

    render(
      <PetMedicationForm
        petId="pet-1"
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );

    // Select medication
    await user.click(screen.getByText('Select Medication'));
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.click(screen.getByText('Select Aspirin'));

    // Submit
    const form = screen.getByRole('form');
    // eslint-disable-next-line no-restricted-syntax
    fireEvent.submit(form);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to add pet medication',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should call onCancel', async () => {
    const user = userEvent.setup();
    render(
      <PetMedicationForm
        petId="pet-1"
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );

    await user.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});

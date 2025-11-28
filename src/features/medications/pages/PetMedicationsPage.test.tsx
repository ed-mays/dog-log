import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PetMedicationsPage } from './PetMedicationsPage';
import {
  usePetMedicationStore,
  type PetMedicationState,
} from '@store/usePetMedicationStore';
import {
  useMedicationStore,
  type MedicationState,
} from '@store/useMedicationStore';
import { useParams } from 'react-router-dom';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}));

vi.mock('@store/usePetMedicationStore');
vi.mock('@store/useMedicationStore');

// Mock PetMedicationForm
vi.mock('../components/PetMedicationForm', () => ({
  PetMedicationForm: ({
    onCancel,
    onSuccess,
  }: {
    onCancel: () => void;
    onSuccess: () => void;
  }) => (
    <div>
      <p>Pet Medication Form</p>
      <button onClick={onCancel}>Cancel Form</button>
      <button onClick={onSuccess}>Success Form</button>
    </div>
  ),
}));

describe('PetMedicationsPage', () => {
  const mockFetchPetMedications = vi.fn();
  const mockDeactivatePetMedication = vi.fn();
  const mockFetchDefinitions = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      petId: 'pet-1',
    });

    vi.mocked(usePetMedicationStore).mockReturnValue({
      petMedications: {
        'pet-1': [
          {
            id: 'pm-1',
            medicationDefinitionId: 'med-1',
            doseAmount: 1,
            doseUnit: 'tablet',
            scheduleType: 'onceDaily',
            active: true,
          },
        ],
      },
      fetchPetMedications: mockFetchPetMedications,
      deactivatePetMedication: mockDeactivatePetMedication,
      isLoading: false,
      error: null,
    } as unknown as PetMedicationState);

    vi.mocked(useMedicationStore).mockReturnValue({
      medications: [{ id: 'med-1', name: 'Aspirin' }],
      fetchMedications: mockFetchDefinitions,
    } as unknown as MedicationState);
  });

  it('should render medications list', () => {
    render(<PetMedicationsPage />);

    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Aspirin')).toBeInTheDocument();
    expect(screen.getByText('1 tablet - onceDaily')).toBeInTheDocument();
    expect(mockFetchPetMedications).toHaveBeenCalledWith('pet-1');
  });

  it('should switch to add form', async () => {
    const user = userEvent.setup();
    render(<PetMedicationsPage />);

    await user.click(screen.getByText('Add Medication'));

    expect(screen.getByText('Pet Medication Form')).toBeInTheDocument();
  });

  it('should deactivate medication', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<PetMedicationsPage />);

    const deleteButtons = screen.getAllByLabelText('delete');
    await user.click(deleteButtons[0]);

    expect(mockDeactivatePetMedication).toHaveBeenCalledWith('pet-1', 'pm-1');
  });

  it('should handle loading state', () => {
    vi.mocked(usePetMedicationStore).mockReturnValue({
      petMedications: {},
      fetchPetMedications: mockFetchPetMedications,
      isLoading: true,
      error: null,
    } as unknown as PetMedicationState);

    render(<PetMedicationsPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle empty state', () => {
    vi.mocked(usePetMedicationStore).mockReturnValue({
      petMedications: { 'pet-1': [] },
      fetchPetMedications: mockFetchPetMedications,
      isLoading: false,
      error: null,
    } as unknown as PetMedicationState);

    render(<PetMedicationsPage />);
    expect(
      screen.getByText('No active medications found.')
    ).toBeInTheDocument();
  });

  it('should handle unknown medication name', () => {
    vi.mocked(usePetMedicationStore).mockReturnValue({
      petMedications: {
        'pet-1': [
          {
            id: 'pm-2',
            medicationDefinitionId: 'med-unknown',
            doseAmount: 1,
            doseUnit: 'tablet',
            scheduleType: 'onceDaily',
            active: true,
          },
        ],
      },
      fetchPetMedications: mockFetchPetMedications,
      deactivatePetMedication: mockDeactivatePetMedication,
      isLoading: false,
      error: null,
    } as unknown as PetMedicationState);

    render(<PetMedicationsPage />);
    expect(screen.getByText('Unknown Medication')).toBeInTheDocument();
  });

  it('should handle deactivate cancellation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PetMedicationsPage />);

    const deleteButtons = screen.getAllByLabelText('delete');
    await user.click(deleteButtons[0]);

    expect(mockDeactivatePetMedication).not.toHaveBeenCalled();
  });

  it('should display error message', () => {
    vi.mocked(usePetMedicationStore).mockReturnValue({
      petMedications: {},
      fetchPetMedications: mockFetchPetMedications,
      isLoading: false,
      error: 'Failed to fetch',
    } as unknown as PetMedicationState);

    render(<PetMedicationsPage />);
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('should handle form success and cancel', async () => {
    const user = userEvent.setup();
    render(<PetMedicationsPage />);

    // Open form
    await user.click(screen.getByText('Add Medication'));
    expect(screen.getByText('Pet Medication Form')).toBeInTheDocument();

    // Cancel form
    await user.click(screen.getByText('Cancel Form'));
    expect(screen.queryByText('Pet Medication Form')).not.toBeInTheDocument();
    expect(screen.getByText('Add Medication')).toBeInTheDocument();

    // Open form again
    await user.click(screen.getByText('Add Medication'));

    // Success form
    await user.click(screen.getByText('Success Form'));
    expect(screen.queryByText('Pet Medication Form')).not.toBeInTheDocument();
    expect(screen.getByText('Add Medication')).toBeInTheDocument();
  });

  it('should return null if no petId', () => {
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({});
    const { container } = render(<PetMedicationsPage />);
    expect(container).toBeEmptyDOMElement();
  });
});

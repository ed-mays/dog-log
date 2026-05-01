import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DoseLogForm } from './DoseLogForm';
import type { PetMedication, DoseLog } from '@features/medications/types';
import userEvent from '@testing-library/user-event';

import { useFeatureFlag } from '@featureFlags/hooks/useFeatureFlag';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultVal: string) => defaultVal,
  }),
}));

// Mock feature flag
vi.mock('@featureFlags/hooks/useFeatureFlag', () => ({
  useFeatureFlag: vi.fn(),
}));

vi.mock('@store/auth.store', () => ({
  useAuthStore: {
    getState: () => ({
      user: { uid: 'user-123' },
    }),
  },
}));

describe('DoseLogForm', () => {
  const mockPetMedication: PetMedication = {
    id: 'med-1',
    petId: 'pet-1',
    medicationDefinitionId: 'def-1',
    form: 'pill',
    route: 'oral',
    doseAmount: 1,
    doseUnit: 'tablet',
    scheduleType: 'onceDaily',
    scheduleConfig: { startDate: '2023-01-01' },
    active: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    createdBy: 'user',
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    // Mock feature flag enabled by default
    vi.mocked(useFeatureFlag).mockReturnValue(true);

    // Mock form validation which can be flaky in JSDOM
    HTMLFormElement.prototype.checkValidity = vi.fn().mockReturnValue(true);
    HTMLFormElement.prototype.reportValidity = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly with default values', () => {
    render(
      <DoseLogForm
        petMedication={mockPetMedication}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Log Dose')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(1); // Amount
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes[0]).toHaveTextContent('Tablet'); // Unit
    expect(comboboxes[1]).toHaveTextContent('Given'); // Status
  });

  it('renders correctly with initial data', () => {
    const initialData: DoseLog = {
      id: 'log-1',
      petId: 'pet-1',
      petMedicationId: 'med-1',
      timestampGiven: '2023-10-27T10:00:00.000Z',
      amountGiven: 2,
      doseUnit: 'mL',
      status: 'skipped',
      notes: 'Test notes',
      createdAt: new Date('2023-10-27'),
      updatedAt: new Date('2023-10-27'),
      createdBy: 'user',
    };

    render(
      <DoseLogForm
        petMedication={mockPetMedication}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={initialData}
      />
    );

    expect(screen.getByText('Edit Dose Log')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes[0]).toHaveTextContent('mL');
    expect(comboboxes[1]).toHaveTextContent('Skipped');
    expect(screen.getByRole('textbox')).toHaveValue('Test notes');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DoseLogForm
        petMedication={mockPetMedication}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('submits form with default values', async () => {
    const user = userEvent.setup();
    render(
      <DoseLogForm
        petMedication={mockPetMedication}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Try submitting via Enter key on the form or button
    const saveButton = screen.getByRole('button', { name: 'Save' });
    // Actually, let's try tabbing to it.
    saveButton.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          petId: mockPetMedication.petId,
          petMedicationId: mockPetMedication.id,
          amountGiven: 1, // Default
          doseUnit: 'tablet', // Default
          status: 'given', // Default
          createdBy: 'user-123',
        })
      );
    });
  });

  // Heavy interaction test (clears + types into multiple inputs, multiple combobox selects).
  // Default 5s timeout is tight on slower environments (husky pre-push under load).
  it('submits form with modified data', async () => {
    const user = userEvent.setup();
    render(
      <DoseLogForm
        petMedication={mockPetMedication}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Change timestamp
    const timeInput = screen.getByLabelText(/Time Given/i);
    await user.clear(timeInput);
    await user.type(timeInput, '2023-10-28T12:00');

    // Change amount
    const amountInput = screen.getByRole('spinbutton');
    await user.clear(amountInput);
    await user.type(amountInput, '2.5');
    expect(amountInput).toHaveValue(2.5);

    // Change unit
    const unitSelect = screen.getAllByRole('combobox')[0];
    await user.click(unitSelect);
    const mlOption = screen.getByRole('option', { name: 'mL' });
    await user.click(mlOption);

    // Change status
    const statusSelect = screen.getAllByRole('combobox')[1];
    await user.click(statusSelect);
    const skippedOption = screen.getByRole('option', { name: 'Skipped' });
    await user.click(skippedOption);

    // Change notes
    const notesInput = screen.getByRole('textbox');
    await user.click(notesInput);
    await user.keyboard('Given with food');
    expect(notesInput).toHaveValue('Given with food');

    // Submit via button click
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          petId: mockPetMedication.petId,
          petMedicationId: mockPetMedication.id,
          timestampGiven: new Date('2023-10-28T12:00').toISOString(),
          amountGiven: 2.5,
          doseUnit: 'mL',
          status: 'skipped',
          notes: 'Given with food',
          createdBy: 'user-123',
        })
      );
    });
  }, 10000);

  it('validates required fields', async () => {
    const { container } = render(
      <DoseLogForm
        petMedication={mockPetMedication}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check Time Given (datetime-local)
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const timeInput = container.querySelector('input[type="datetime-local"]');
    expect(timeInput).toBeRequired();

    expect(screen.getByRole('spinbutton')).toBeRequired();
  });

  it('does not render when feature flag is disabled', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(false);
    const { container } = render(
      <DoseLogForm
        petMedication={mockPetMedication}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

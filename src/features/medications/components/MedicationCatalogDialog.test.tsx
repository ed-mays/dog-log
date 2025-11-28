import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicationCatalogDialog } from './MedicationCatalogDialog';
import { useMedicationStore } from '@store/useMedicationStore';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

vi.mock('@store/useMedicationStore');

describe('MedicationCatalogDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();
  const mockFetchMedications = vi.fn();
  const mockAddMedication = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMedicationStore).mockReturnValue({
      medications: [
        { id: '1', name: 'Aspirin', defaultForm: 'pill', defaultRoute: 'oral' },
        {
          id: '2',
          name: 'Benadryl',
          defaultForm: 'liquid',
          defaultRoute: 'oral',
        },
      ],
      fetchMedications: mockFetchMedications,
      addMedication: mockAddMedication,
      isLoading: false,
    });
  });

  it('should render dialog when open', () => {
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Select Medication')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(mockFetchMedications).toHaveBeenCalled();
  });

  it('should filter medications based on search', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    const searchInput = screen.getByLabelText('Search');
    await user.type(searchInput, 'Asp');

    expect(screen.getByText('Aspirin')).toBeInTheDocument();
    expect(screen.queryByText('Benadryl')).not.toBeInTheDocument();
  });

  it('should show no results message', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    const searchInput = screen.getByLabelText('Search');
    await user.type(searchInput, 'XYZ');

    expect(screen.getByText('No medications found')).toBeInTheDocument();
  });

  it('should select a medication', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await user.click(screen.getByText('Aspirin'));

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Aspirin' })
    );
  });

  it('should switch to create mode', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await user.click(screen.getByText('Create New Medication'));

    expect(
      screen.getByText('Create New Medication', { selector: 'h2' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('should create a new medication', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    // Switch to create mode
    await user.click(screen.getByText('Create New Medication'));

    // Fill form
    await user.type(screen.getByLabelText('Name'), 'New Med');

    // Click create
    await user.click(screen.getByText('Create', { selector: 'button' }));

    await waitFor(() => {
      expect(mockAddMedication).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Med',
          defaultForm: 'pill',
          defaultRoute: 'oral',
        })
      );
    });
  });

  it('should not create medication with empty name', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await user.click(screen.getByText('Create New Medication'));
    await user.click(screen.getByText('Create', { selector: 'button' }));

    expect(mockAddMedication).not.toHaveBeenCalled();
  });

  it('should handle creation error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAddMedication.mockRejectedValueOnce(new Error('Failed'));
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await user.click(screen.getByText('Create New Medication'));
    await user.type(screen.getByLabelText('Name'), 'New Med');
    await user.click(screen.getByText('Create', { selector: 'button' }));

    await waitFor(() => {
      expect(mockAddMedication).toHaveBeenCalled();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should cancel creation and return to list', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await user.click(screen.getByText('Create New Medication'));
    expect(
      screen.getByText('Create New Medication', { selector: 'h2' })
    ).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.getByText('Select Medication')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when canceling from list', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await user.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should update form and route selects', async () => {
    const user = userEvent.setup();
    render(
      <MedicationCatalogDialog
        open={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
      />
    );

    await user.click(screen.getByText('Create New Medication'));

    // MUI Selects are rendered as comboboxes
    const comboboxes = screen.getAllByRole('combobox');
    const formSelect = comboboxes[0]; // First one is Form
    const routeSelect = comboboxes[1]; // Second one is Route

    await user.click(formSelect);
    await user.click(screen.getByRole('option', { name: 'Liquid' }));

    await user.click(routeSelect);
    await user.click(screen.getByRole('option', { name: 'Topical' }));

    await user.type(screen.getByLabelText('Name'), 'New Med');
    await user.click(screen.getByText('Create', { selector: 'button' }));

    await waitFor(() => {
      expect(mockAddMedication).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultForm: 'liquid',
          defaultRoute: 'topical',
        })
      );
    });
  });
});

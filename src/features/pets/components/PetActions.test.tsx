import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { render } from '@test-utils';
import { PetActions } from './PetActions';
import { makePet } from '@testUtils/factories/makePet';

describe('PetActions', () => {
  const defaultPet = makePet({ id: '1', name: 'Buddy' });
  const defaultProps = {
    pet: defaultPet,
    onEdit: vi.fn(),
    onDelete: vi.fn().mockResolvedValue(undefined),
    deleteError: null,
    isDeleting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Edit and Delete buttons', () => {
    render(<PetActions {...defaultProps} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('calls onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<PetActions {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  test('opens confirm modal when Delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<PetActions {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // We expect the modal to contain the pet name in the confirmation message
    expect(screen.getByText(/Buddy/)).toBeInTheDocument();
  });

  test('calls onDelete when deletion is confirmed', async () => {
    const user = userEvent.setup();
    render(<PetActions {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /yes/i }));

    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  test('closes modal and does not call onDelete when canceled', async () => {
    const user = userEvent.setup();
    render(<PetActions {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /no/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
  });

  test('disables buttons when isDeleting is true', () => {
    render(<PetActions {...defaultProps} isDeleting={true} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  test('shows error message in modal when deleteError is present', async () => {
    const user = userEvent.setup();
    render(<PetActions {...defaultProps} deleteError="Delete failed" />);

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByText('Delete failed')).toBeInTheDocument();
  });
});

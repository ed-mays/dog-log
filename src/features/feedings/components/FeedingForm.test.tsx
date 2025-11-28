import { render, screen, waitFor } from '@testing-library/react';
import { FeedingForm } from './FeedingForm';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('FeedingForm', () => {
  it('renders form fields', () => {
    render(<FeedingForm onSubmit={vi.fn()} />);

    expect(screen.getAllByLabelText(/date & time/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/food type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add feeding/i })
    ).toBeInTheDocument();
  });

  it('shows validation error if food type is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<FeedingForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /add feeding/i }));

    expect(screen.getByText(/food type is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<FeedingForm onSubmit={onSubmit} />);

    const foodInput = screen.getByLabelText(/food type/i);
    const notesInput = screen.getByLabelText(/notes/i);

    await user.type(foodInput, 'Kibble');
    await user.type(notesInput, 'Yummy');
    await user.click(screen.getByRole('button', { name: /add feeding/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          foodType: 'Kibble',
          notes: 'Yummy',
          date: expect.any(Date),
        })
      );
    });
  });

  it('handles submission error', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Failed'));
    const user = userEvent.setup();
    render(<FeedingForm onSubmit={onSubmit} />);

    const foodInput = screen.getByLabelText(/food type/i);
    await user.type(foodInput, 'Kibble');
    await user.click(screen.getByRole('button', { name: /add feeding/i }));

    expect(
      await screen.findByText(/failed to save feeding/i)
    ).toBeInTheDocument();
  });

  it('disables button when submitting', () => {
    render(<FeedingForm onSubmit={vi.fn()} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});

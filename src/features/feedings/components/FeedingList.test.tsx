import { render, screen } from '@testing-library/react';
import { FeedingList } from './FeedingList';
import { describe, it, expect, vi } from 'vitest';
import type { Feeding } from '@features/feedings/types';
import userEvent from '@testing-library/user-event';

describe('FeedingList', () => {
  const mockFeedings: Feeding[] = [
    {
      id: '1',
      date: new Date('2023-01-01T10:00:00'),
      foodType: 'Kibble',
      notes: 'Ate well',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    },
    {
      id: '2',
      date: new Date('2023-01-02T18:00:00'),
      foodType: 'Wet Food',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
    },
  ];

  it('renders "no feedings" message when list is empty', () => {
    render(<FeedingList feedings={[]} onDelete={vi.fn()} />);
    expect(screen.getByText(/no feedings recorded yet/i)).toBeInTheDocument();
  });

  it('renders list of feedings', () => {
    render(<FeedingList feedings={mockFeedings} onDelete={vi.fn()} />);

    expect(screen.getByText('Kibble')).toBeInTheDocument();
    expect(screen.getByText('Ate well')).toBeInTheDocument();
    expect(screen.getByText('Wet Food')).toBeInTheDocument();

    // Check for date formatting (locale string format varies, checking partial match)
    expect(screen.getAllByText(/2023/).length).toBeGreaterThan(0);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<FeedingList feedings={mockFeedings} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith('1');
  });
});

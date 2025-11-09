import React from 'react';
import { render } from '@test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PetSortSelector, type SortOrder } from './PetSortSelector';

// These tests are colocated with the component per project conventions.
// They focus on the selector's accessible contract and controlled behavior.

describe('PetSortSelector', () => {
  test('renders as a labeled combobox and calls onChange when selecting an option', async () => {
    const onChange = vi.fn();

    render(
      <PetSortSelector value={'asc' satisfies SortOrder} onChange={onChange} />
    );

    // Accessible combobox labeled by i18n key `petList:sort.label`
    const combo = screen.getByRole('combobox', { name: /sort by name/i });
    expect(combo).toBeInTheDocument();

    // It should show the current selected label (Ascending)
    expect(combo).toHaveTextContent(/ascending/i);

    const user = userEvent.setup();

    // Open the menu and pick Descending
    await user.click(combo);
    const option = await screen.findByRole('option', { name: /descending/i });
    await user.click(option);

    // Controlled component should report change
    expect(onChange).toHaveBeenCalledWith('desc');
  });

  test('supports keyboard interaction to change the value', async () => {
    const onChange = vi.fn();
    render(
      <PetSortSelector value={'asc' satisfies SortOrder} onChange={onChange} />
    );

    const user = userEvent.setup();
    const combo = screen.getByRole('combobox', { name: /sort by name/i });

    // Focus and open, then use ArrowDown + Enter to select the next option
    await user.click(combo);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('desc');
  });
});

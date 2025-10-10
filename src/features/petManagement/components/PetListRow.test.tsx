import React from 'react';
import { render, screen, fireEvent } from '@test-utils';
import { PetListRow } from './PetListRow';
import type { Pet } from '../types';

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: '1',
    name: 'Fido',
    breed: 'Mix',
    birthDate: new Date('2020-01-01'),
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    createdBy: 'user1',
    isArchived: false,
    ...overrides,
  };
}

describe('PetListRow', () => {
  it('renders Edit/Delete buttons when petActionsEnabled=true and calls callbacks', async () => {
    const pet = makePet();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <table>
        <tbody>
          <PetListRow pet={pet} onEdit={onEdit} onDelete={onDelete} />
        </tbody>
      </table>,
      { featureFlags: { petActionsEnabled: true } }
    );

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });

    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(pet);

    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(pet);
  });

  it('hides Edit/Delete when petActionsEnabled=false', () => {
    const pet = makePet();

    render(
      <table>
        <tbody>
          <PetListRow pet={pet} />
        </tbody>
      </table>,
      { featureFlags: { petActionsEnabled: false } }
    );

    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });
});

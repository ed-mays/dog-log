import React from 'react';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
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
  it('renders Edit/Delete buttons when petActionsEnabled=true; navigates on Edit and calls onDelete', async () => {
    const pet = makePet();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    // Spy on useNavigate
    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return { ...mod, useNavigate: () => navSpy };
    });
    // Need to re-import component after mocking
    const { PetListRow: MockedPetListRow } = await import('./PetListRow');

    render(
      <table>
        <tbody>
          <MockedPetListRow pet={pet} onDelete={onDelete} />
        </tbody>
      </table>,
      { featureFlags: { petActionsEnabled: true } }
    );

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });

    await user.click(editBtn);
    expect(navSpy).toHaveBeenCalledWith(`/pets/${pet.id}/edit`);

    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(pet);
  });

  it('hides Edit/Delete when petActionsEnabled=false', async () => {
    const pet = makePet();

    const { PetListRow } = await import('./PetListRow');

    render(
      <table>
        <tbody>
          <PetListRow pet={pet} />
        </tbody>
      </table>,
      { featureFlags: { petActionsEnabled: false } }
    );

    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
  });
});

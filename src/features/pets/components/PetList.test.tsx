import React from 'react';
import { act } from 'react';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import type { Pet } from '../types';
import { makePet } from '@testUtils/factories/makePet';
import { createPetsStoreMock } from '@testUtils/mocks/mockStores';
import { vi } from 'vitest';

// Mock the module at the top level
vi.mock('@store/pets.store.ts', () => ({
  usePetsStore: vi.fn(),
}));

let mockUsePetsStore: vi.Mock;
let renderTestUtils: typeof import('@test-utils').render; // Declare type for render

describe('PetList card view', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // Reset modules to ensure fresh mocks

    // Dynamically import the mocked module after resetModules
    const petsStoreModule = await import('@store/pets.store');
    mockUsePetsStore = petsStoreModule.usePetsStore as vi.Mock;

    // Dynamically import render from @test-utils after resetModules
    const testUtilsModule = await import('@test-utils');
    renderTestUtils = testUtilsModule.render;
  });

  async function setup(
    flags: { addPetEnabled?: boolean } = {},
    initialPets: Pet[] = [makePet({ id: '1', name: 'Fido', breed: 'Mix' })]
  ) {
    const petsMock = createPetsStoreMock({ pets: initialPets });
    mockUsePetsStore.mockImplementation(petsMock.impl);

    const { PetList } = await import('./PetList');
    renderTestUtils(<PetList />, {
      featureFlags: {
        addPetEnabled: true,
        ...flags,
      },
    });

    return {
      storeActions: petsMock.actions,
      getPets: () => petsMock.getState().pets,
    };
  }

  test('renders a PetCard for each pet showing name and breed', async () => {
    const pets = [
      makePet({ id: '1', name: 'Buddy', breed: 'Labrador' }),
      makePet({ id: '2', name: 'Milo', breed: 'Beagle' }),
    ];
    await setup({}, pets);

    // Grid wrapper is present
    expect(await screen.findByLabelText(/pet card grid/i)).toBeInTheDocument();

    // Two headings for pet names (Typography component h3)
    const headings = await screen.findAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(['Buddy', 'Milo']);

    // Breed texts visible
    expect(screen.getByText('Labrador')).toBeInTheDocument();
    expect(screen.getByText('Beagle')).toBeInTheDocument();
  });

  test('navigates to the new pet page when Add Pet is clicked', async () => {
    await setup();
    const addPetButton = await screen.findByTestId('add-pet-button');
    expect(addPetButton).toHaveAttribute('href', '/pets/new');
  });

  test('does not render add pet button when addPetEnabled=false', async () => {
    await setup({ addPetEnabled: false });
    // Ensure list/grid rendered for non-empty state
    await screen.findByLabelText(/pet card grid/i);
    expect(screen.queryByTestId('add-pet-button')).not.toBeInTheDocument();
  });

  test('shows "No Pets" indicator when user has no pets', async () => {
    await setup({}, []);

    const indicator = await screen.findByTestId('no-pets-indicator');
    expect(indicator).toBeInTheDocument();
    // Grid should not be present
    expect(screen.queryByLabelText(/pet card grid/i)).not.toBeInTheDocument();
    // Has the label text
    expect(
      screen.getByText("You don't have any pets yet.")
    ).toBeInTheDocument();
  });

  test('indicator shows CTA link to Add Pet that navigates to /pets/new', async () => {
    await setup({ addPetEnabled: true }, []);

    const indicator = await screen.findByTestId('no-pets-indicator');
    expect(indicator).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: /add your first pet now/i });
    expect(cta).toHaveAttribute('href', '/pets/new');
  });

  test('adding first pet switches from indicator to card grid', async () => {
    const { storeActions } = await setup({}, []);

    // Empty state initially
    const indicator = await screen.findByTestId('no-pets-indicator');

    // Add a pet via store mock
    await act(async () => {
      await storeActions.addPet({ id: '10', name: 'Rex' } as Partial<Pet>);
    });

    // Wait for the indicator to be removed (state update + re-render)
    await waitForElementToBeRemoved(indicator);

    // Should render the card grid now
    expect(await screen.findByLabelText(/pet card grid/i)).toBeInTheDocument();
  });
});

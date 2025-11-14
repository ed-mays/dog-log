import React from 'react';
import { act } from 'react';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import type { Pet } from '../types';
import { makePet } from '@testUtils/factories/makePet';
import { vi } from 'vitest';
import { render } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { installPetsStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { PetList } from './PetList';

// Mock the module at the top level
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

describe('PetList card view', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  async function setup(
    flags: { addPetEnabled?: boolean } = {},
    initialPets: Pet[] = [makePet({ id: '1', name: 'Fido', breed: 'Mix' })]
  ) {
    const petsMock = installPetsStoreMock({ pets: initialPets });

    render(<PetList />, {
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

// Additional tests for sorting, persistence, and branch coverage

describe('PetList sorting and persistence', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear persisted sort between tests unless a test sets it explicitly
    try {
      localStorage.removeItem('doglog:petList:sortOrder');
    } catch {
      // Ignore persistence errors in test environment (e.g., restricted Storage)
    }
  });

  test('defaults to ascending (A→Z) order, case-insensitive and locale-aware', async () => {
    const pets = [
      makePet({ id: '2', name: 'Zelda' }),
      makePet({ id: '1', name: 'alfie' }),
      makePet({ id: '3', name: 'Bella' }),
    ];
    await (async () => {
      const petsMock = installPetsStoreMock({ pets });
      render(<PetList />, { featureFlags: { addPetEnabled: true } });
      expect(
        await screen.findByLabelText(/pet card grid/i)
      ).toBeInTheDocument();
      const headings = await screen.findAllByRole('heading', { level: 3 });
      expect(headings.map((h) => h.textContent)).toEqual([
        'alfie',
        'Bella',
        'Zelda',
      ]);
      return petsMock;
    })();
  });

  test('uses persisted desc order from localStorage and writes it back on mount', async () => {
    localStorage.setItem('doglog:petList:sortOrder', 'desc');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const pets = [
      makePet({ id: '2', name: 'Zelda' }),
      makePet({ id: '1', name: 'alfie' }),
      makePet({ id: '3', name: 'Bella' }),
    ];
    installPetsStoreMock({ pets });

    render(<PetList />, { featureFlags: { addPetEnabled: true } });

    const headings = await screen.findAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual([
      'Zelda',
      'Bella',
      'alfie',
    ]);

    // Effect should persist current value (desc) again
    expect(setItemSpy).toHaveBeenCalledWith('doglog:petList:sortOrder', 'desc');
  });

  test('defaults to asc when localStorage key is missing or invalid and persists asc', async () => {
    localStorage.setItem('doglog:petList:sortOrder', 'weird');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const pets = [
      makePet({ id: '2', name: 'Zelda' }),
      makePet({ id: '1', name: 'alfie' }),
      makePet({ id: '3', name: 'Bella' }),
    ];
    installPetsStoreMock({ pets });

    render(<PetList />, { featureFlags: { addPetEnabled: true } });

    const headings = await screen.findAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual([
      'alfie',
      'Bella',
      'Zelda',
    ]);
    expect(setItemSpy).toHaveBeenCalledWith('doglog:petList:sortOrder', 'asc');
  });

  test('does not crash if localStorage.setItem throws (covers catch branch)', async () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('boom');
      });

    const pets = [makePet({ id: '1', name: 'Buddy' })];
    installPetsStoreMock({ pets });

    render(<PetList />, { featureFlags: { addPetEnabled: true } });

    expect(await screen.findByLabelText(/pet card grid/i)).toBeInTheDocument();

    // Restore spy
    spy.mockRestore();
  });

  test('non-empty branch renders grid and not the empty indicator', async () => {
    const pets = [makePet({ id: '1', name: 'Buddy' })];
    installPetsStoreMock({ pets });

    render(<PetList />, { featureFlags: { addPetEnabled: true } });

    expect(await screen.findByLabelText(/pet card grid/i)).toBeInTheDocument();
    expect(screen.queryByTestId('no-pets-indicator')).not.toBeInTheDocument();
  });

  test('shows LoadingIndicator when isFetching is true', async () => {
    installPetsStoreMock({ pets: [], isFetching: true });
    render(<PetList />);
    expect(await screen.findByTestId('loading-indicator')).toBeInTheDocument();
  });
});

// Separate test to cover the nsReady early-return branch without module remapping

describe('PetList namespace loading', () => {
  test('initially renders nothing (nsReady=false), then renders after namespaces load', async () => {
    const pets = [makePet({ id: '1', name: 'Buddy' })];
    installPetsStoreMock({ pets });

    // Render with standard providers; on first paint nsReady=false returns null
    render(<PetList />, { featureFlags: { addPetEnabled: true } });

    // Immediately after render, neither grid nor empty indicator should be present
    expect(screen.queryByLabelText(/pet card grid/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('no-pets-indicator')).not.toBeInTheDocument();

    // After namespaces load, list appears
    expect(await screen.findByLabelText(/pet card grid/i)).toBeInTheDocument();
  });
});

// New tests for the sorting selector UI (Step 3)
describe('PetList sort selector UI', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    try {
      localStorage.removeItem('doglog:petList:sortOrder');
    } catch {
      // Ignore persistence errors in test environment
    }
  });

  test('shows sorting selector for non-empty lists and allows switching to Descending (Z→A)', async () => {
    const pets = [
      makePet({ id: '2', name: 'Zelda' }),
      makePet({ id: '1', name: 'alfie' }),
      makePet({ id: '3', name: 'Bella' }),
    ];
    installPetsStoreMock({ pets });

    render(<PetList />, { featureFlags: { addPetEnabled: true } });

    // Selector should be present with accessible label
    const user = userEvent.setup();
    const combo = await screen.findByRole('combobox', {
      name: /sort by name/i,
    });
    expect(combo).toBeInTheDocument();

    // Assert initial order is ascending (A→Z)
    const headingsAsc = await screen.findAllByRole('heading', { level: 3 });
    expect(headingsAsc.map((h) => h.textContent)).toEqual([
      'alfie',
      'Bella',
      'Zelda',
    ]);

    // Change to Descending
    await user.click(combo);
    await user.click(screen.getByRole('option', { name: /descending/i }));

    const headingsDesc = await screen.findAllByRole('heading', { level: 3 });
    expect(headingsDesc.map((h) => h.textContent)).toEqual([
      'Zelda',
      'Bella',
      'alfie',
    ]);

    // Persists to localStorage on change
    expect(localStorage.getItem('doglog:petList:sortOrder')).toBe('desc');
  });

  test('does not show sorting selector when list is empty', async () => {
    installPetsStoreMock({ pets: [] });
    render(<PetList />, { featureFlags: { addPetEnabled: true } });

    // Empty indicator is shown
    expect(await screen.findByTestId('no-pets-indicator')).toBeInTheDocument();
    // Selector hidden
    expect(
      screen.queryByRole('combobox', { name: /sort by name/i })
    ).not.toBeInTheDocument();
  });
});

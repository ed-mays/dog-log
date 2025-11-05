import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Pet } from '@features/pets/types';
import { vi } from 'vitest';

// Mock the store module at the top level
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

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
  } as Pet;
}

describe('PetDetailsPage', () => {
  let mockUsePetsStore: vi.Mock;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const petsStoreModule = await import('@store/pets.store');
    mockUsePetsStore = petsStoreModule.usePetsStore as vi.Mock;
  });

  test('renders pet name and breed in a table', async () => {
    const statePets = [makePet({ id: '1', name: 'Buddy', breed: 'Labrador' })];
    const actions = {
      deletePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: statePets, ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />);

    // Headers and values should be visible
    expect(await screen.findByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText(/breed/i)).toBeInTheDocument();
    expect(screen.getByText('Labrador')).toBeInTheDocument();

    // Table should be present
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('shows Edit/Delete when petActionsEnabled=true and navigates on Edit', async () => {
    const pet = makePet({ id: '1' });
    const actions = {
      deletePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [pet], ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    const deleteBtn = screen.getByRole('button', { name: /delete/i });

    const user = userEvent.setup();
    await user.click(editBtn);

    await waitFor(() => {
      expect(navSpy).toHaveBeenCalledWith('/pets/1/edit');
    });

    expect(deleteBtn).toBeInTheDocument();
  });

  test('delete flow: opens confirm modal, confirms deletion, navigates to /pets', async () => {
    const pet = makePet({ id: '1', name: 'Fido' });
    const actions = {
      deletePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [pet], ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    const user = userEvent.setup();

    // Open confirm
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    await user.click(deleteBtn);

    // Confirm modal should appear with Yes/No buttons
    const yesBtn = await screen.findByRole('button', { name: /yes/i });
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();

    await user.click(yesBtn);

    await waitFor(() => {
      expect(actions.deletePet).toHaveBeenCalledWith('1');
      expect(navSpy).toHaveBeenCalledWith('/pets');
    });
  });

  test('hides Edit/Delete when petActionsEnabled=false', async () => {
    const pet = makePet({ id: '1' });
    const actions = {
      deletePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [pet], ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: false } });

    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  test('shows Not Found when pet id is invalid', async () => {
    const actions = {
      deletePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [], ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: 'does-not-exist' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  // Additional coverage tests for failure and back link

  test('delete failure shows error alert, closes modal, and does not navigate', async () => {
    const pet = makePet({ id: '1', name: 'Fido' });
    const actions = {
      deletePet: vi.fn(async () => {
        throw new Error('delete failed');
      }),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [pet], ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    const user = userEvent.setup();

    // Open confirm modal
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    await user.click(deleteBtn);

    // Confirm and trigger failure
    const yesBtn = await screen.findByRole('button', { name: /yes/i });
    await user.click(yesBtn);

    // Error alert should appear; modal should close; navigate should NOT be called
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(navSpy).not.toHaveBeenCalled();
  });

  test('Back link points to /pets', async () => {
    const pet = makePet({ id: '1', name: 'Buddy' });
    const actions = {
      deletePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [pet], ...actions })
    );

    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        // useNavigate provided but unused in this test
        useNavigate: () => vi.fn(),
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />);

    const backLink = await screen.findByRole('link', { name: /back/i });
    expect(backLink).toBeInTheDocument();
    // JSDOM resolves to absolute URL, so check endsWith
    expect(backLink).toHaveAttribute('href', '/pets');
  });

  // Extra tests to improve function coverage

  test('declining delete closes modal and does not call delete or navigate', async () => {
    const pet = makePet({ id: '1' });
    const actions = {
      deletePet: vi.fn(async () => {}),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [pet], ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    const user = userEvent.setup();

    // Open confirm modal then decline
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    await user.click(deleteBtn);
    const noBtn = await screen.findByRole('button', { name: /no/i });
    await user.click(noBtn);

    // Modal closes, no delete or navigation
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(actions.deletePet).not.toHaveBeenCalled();
    expect(navSpy).not.toHaveBeenCalled();
  });

  test('shows saving indicator while deleting until resolved', async () => {
    const pet = makePet({ id: '1' });
    let resolveDelete: (() => void) | null = null;
    const actions = {
      deletePet: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveDelete = resolve;
          })
      ),
    };
    mockUsePetsStore.mockImplementation((selector) =>
      selector({ pets: [pet], ...actions })
    );

    const navSpy = vi.fn();
    vi.doMock('react-router-dom', async (importOriginal) => {
      const mod: never = await importOriginal();
      return {
        ...mod,
        useParams: () => ({ id: '1' }),
        useNavigate: () => navSpy,
      };
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    const user = userEvent.setup();

    // Trigger delete and keep it pending
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    await user.click(await screen.findByRole('button', { name: /yes/i }));

    // While promise pending, we should see the saving text indicator
    const savingText = await screen.findByText(/saving/i);
    expect(savingText).toBeInTheDocument();

    // Resolve and expect navigation
    resolveDelete?.();

    await waitFor(() => {
      expect(navSpy).toHaveBeenCalledWith('/pets');
    });
  });
});

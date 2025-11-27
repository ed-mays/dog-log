import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Pet } from '@features/pets/types';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import { installPetsStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { makePet } from '@testUtils/factories/makePet';
import { usePetDetails } from '@features/pets/hooks/usePetDetails';

// Mutable state for router mocks
const routerState = {
  params: {} as Record<string, string>,
  navigate: vi.fn(),
};

// Mock usePetDetails globally with override capability
const mockUsePetDetails = vi.fn();
vi.mock('@features/pets/hooks/usePetDetails', async (importOriginal) => {
  const mod =
    await importOriginal<typeof import('@features/pets/hooks/usePetDetails')>();
  return {
    ...mod,
    usePetDetails: () => {
      const override = mockUsePetDetails();
      if (override) return override;
      return mod.usePetDetails();
    },
  };
});

// Mock react-router-dom at top level
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useParams: () => routerState.params,
    useNavigate: () => routerState.navigate,
  };
});

// Mock the store module at the top level
vi.mock('@store/pets.store', () => ({
  usePetsStore: vi.fn(),
}));

vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn((selector) => selector({ user: { uid: 'test-user' } })),
}));

vi.mock('@services/petVetService', () => ({
  petVetService: {
    getPetVets: vi.fn(),
  },
}));

vi.mock('@services/logService', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@i18n', () => ({
  loadNamespace: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@features/pets/components/LinkedVetList', () => ({
  LinkedVetList: () => (
    <div data-testid="linked-vet-list">Mocked LinkedVetList</div>
  ),
}));

vi.mock('@components/common/PhotoUpload', () => ({
  PhotoUpload: ({
    onUploadComplete,
    onError,
  }: {
    onUploadComplete: (url: string, path: string) => void;
    onError: (err: Error) => void;
  }) => (
    <div data-testid="photo-upload">
      <button onClick={() => onUploadComplete('url', 'path')}>Upload</button>
      <button onClick={() => onError(new Error('Upload failed'))}>
        Trigger Error
      </button>
    </div>
  ),
}));

vi.mock('@features/pets/components/PetPhotoGallery', () => ({
  PetPhotoGallery: ({
    onSetMainPhoto,
    onDeletePhoto,
  }: {
    onSetMainPhoto: (photo: { url: string }) => void;
    onDeletePhoto: (photo: { path: string }) => void;
  }) => (
    <div data-testid="pet-photo-gallery">
      <button onClick={() => onSetMainPhoto({ url: 'u1' })}>Set Main</button>
      <button onClick={() => onDeletePhoto({ path: 'p1' })}>Delete</button>
    </div>
  ),
}));

describe('PetDetailsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUsePetDetails.mockReturnValue(undefined);
    routerState.params = {};
    routerState.navigate = vi.fn();
  });

  async function setup(
    options: {
      petId?: string;
      pets?: Pet[];
      storeOverrides?: Record<string, unknown>;
      flags?: Record<string, boolean>;
      hookOverrides?: Partial<ReturnType<typeof usePetDetails>>;
    } = {}
  ) {
    const {
      petId = '1',
      pets = [makePet({ id: '1' })],
      storeOverrides,
      flags = {},
      hookOverrides = {},
    } = options;

    // Update router state
    routerState.params = { id: petId };
    const navigate = routerState.navigate;

    const petsMock = installPetsStoreMock({ pets, ...storeOverrides });

    // Configure usePetDetails mock
    const targetPet = pets.find((p) => p.id === petId);
    const handleDeleteMock = vi.fn();

    const defaultHookValues: ReturnType<typeof usePetDetails> = {
      pet: targetPet,
      vetLinks: [],
      loadingVets: false,
      saving: false,
      error: null,
      vetsEnabled: !!flags.vetsEnabled,
      vetLinkingEnabled: !!flags.vetLinkingEnabled,
      petActionsEnabled: !!flags.petActionsEnabled,
      petPhotosEnabled: !!flags.petPhotosEnabled,
      handleDelete: handleDeleteMock,
      handlePhotoUpload: vi.fn(),
      handleSetMainPhoto: vi.fn(),
      handleDeletePhoto: vi.fn(),
      navigate: navigate,
      nsReady: true,
    };

    mockUsePetDetails.mockReturnValue({
      ...defaultHookValues,
      ...hookOverrides,
    });

    const { default: PetDetailsPage } = await import('./PetDetailsPage');
    const { render } = await import('@test-utils');
    const user = userEvent.setup();
    return {
      petsMock,
      navigate,
      PetDetailsPage,
      render,
      user,
      flags,
      handleDeleteMock,
    };
  }

  test('renders pet name and breed in a table', async () => {
    const pet = makePet({ id: '1', name: 'Buddy', breed: 'Labrador' });

    const { PetDetailsPage, render } = await setup({
      pets: [pet],
      // Explicitly disable flags to match original test intent
      flags: {
        vetsEnabled: false,
        vetLinkingEnabled: false,
        petActionsEnabled: false,
      },
    });

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
    const { navigate, PetDetailsPage, render, user } = await setup({
      pets: [makePet({ id: '1' })],
      flags: { petActionsEnabled: true },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });

    await user.click(editBtn);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/pets/1/edit');
    });

    expect(deleteBtn).toBeInTheDocument();
  });

  test('delete flow: opens confirm modal, confirms deletion, calls handleDelete', async () => {
    const pet = makePet({ id: '1', name: 'Fido' });

    const { PetDetailsPage, render, user, handleDeleteMock } = await setup({
      pets: [pet],
      flags: { petActionsEnabled: true },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    // Details tab is default, so buttons should be visible
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    await user.click(deleteBtn);

    // Confirm modal should appear with Yes/No buttons
    const yesBtn = await screen.findByRole('button', { name: /yes/i });
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();

    await user.click(yesBtn);

    await waitFor(() => {
      expect(handleDeleteMock).toHaveBeenCalled();
    });
  });

  test('hides Edit/Delete when petActionsEnabled=false', async () => {
    const pet = makePet({ id: '1' });
    const { PetDetailsPage, render } = await setup({
      pets: [pet],
      flags: { petActionsEnabled: false },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: false } });

    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  test('shows Not Found when pet id is invalid', async () => {
    const { PetDetailsPage, render } = await setup({
      pets: [],
      petId: 'does-not-exist',
    });

    render(<PetDetailsPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  // Additional coverage tests for failure and back link

  test('delete failure shows error alert (simulated via hook state)', async () => {
    const pet = makePet({ id: '1', name: 'Fido' });

    // We simulate the error state directly via the hook mock
    const { PetDetailsPage, render } = await setup({
      pets: [pet],
      flags: { petActionsEnabled: true },
      hookOverrides: {
        error: 'delete failed',
        saving: false,
      },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    // Error alert should appear
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('delete failed')).toBeInTheDocument();
  });

  test('Back link points to /pets', async () => {
    const pet = makePet({ id: '1', name: 'Buddy' });
    const { PetDetailsPage, render } = await setup({ pets: [pet] });

    render(<PetDetailsPage />);

    const backLink = await screen.findByRole('link', { name: /back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/pets');
  });

  // Extra tests to improve function coverage

  test('declining delete closes modal and does not call handleDelete', async () => {
    const pet = makePet({ id: '1' });
    const { PetDetailsPage, render, user, handleDeleteMock } = await setup({
      pets: [pet],
      flags: { petActionsEnabled: true },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    // Open confirm modal then decline
    const deleteBtn = await screen.findByRole('button', { name: /delete/i });
    await user.click(deleteBtn);
    const noBtn = await screen.findByRole('button', { name: /no/i });
    await user.click(noBtn);

    // Modal closes, no delete
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handleDeleteMock).not.toHaveBeenCalled();
  });

  test('shows saving indicator when saving=true', async () => {
    const pet = makePet({ id: '1' });

    const { PetDetailsPage, render } = await setup({
      pets: [pet],
      flags: { petActionsEnabled: true },
      hookOverrides: { saving: true },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    const savingText = await screen.findByText(/saving/i);
    expect(savingText).toBeInTheDocument();
  });

  test('renders LinkedVetList when vets enabled', async () => {
    const pet = makePet({ id: '1' });

    const { PetDetailsPage, render, user } = await setup({
      pets: [pet],
      flags: { vetsEnabled: true, vetLinkingEnabled: true },
    });

    render(<PetDetailsPage />, {
      featureFlags: { vetsEnabled: true, vetLinkingEnabled: true },
    });

    // Click Veterinarians tab
    const vetsTab = screen.getByRole('tab', { name: /veterinarians/i });
    await user.click(vetsTab);

    // Should show LinkedVetList (mocked)
    expect(await screen.findByTestId('linked-vet-list')).toBeInTheDocument();
  });

  test('renders PhotoUpload and PetPhotoGallery when petPhotosEnabled=true and handles interactions', async () => {
    const pet = makePet({
      id: '1',
      photos: [{ path: 'p1', url: 'u1', createdAt: 'd1' }],
    });
    const handlePhotoUploadMock = vi.fn();
    const handleSetMainPhotoMock = vi.fn();
    const handleDeletePhotoMock = vi.fn();

    const { PetDetailsPage, render, user } = await setup({
      pets: [pet],
      flags: { petPhotosEnabled: true },
      hookOverrides: {
        handlePhotoUpload: handlePhotoUploadMock,
        handleSetMainPhoto: handleSetMainPhotoMock,
        handleDeletePhoto: handleDeletePhotoMock,
      },
    });

    render(<PetDetailsPage />, { featureFlags: { petPhotosEnabled: true } });

    // Click Photos tab
    const photosTab = screen.getByRole('tab', { name: /photos/i });
    await user.click(photosTab);

    // Check for components
    expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
    expect(screen.getByTestId('pet-photo-gallery')).toBeInTheDocument();

    // Test interactions
    await user.click(screen.getByText('Upload'));
    expect(handlePhotoUploadMock).toHaveBeenCalledWith('url', 'path');

    await user.click(screen.getByText('Set Main'));
    expect(handleSetMainPhotoMock).toHaveBeenCalledWith({ url: 'u1' });

    await user.click(screen.getByText('Delete'));
    expect(handleDeletePhotoMock).toHaveBeenCalledWith({ path: 'p1' });
  });

  test('logs error when PhotoUpload fails', async () => {
    const pet = makePet({ id: '1' });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { PetDetailsPage, render, user } = await setup({
      pets: [pet],
      flags: { petPhotosEnabled: true },
    });

    render(<PetDetailsPage />, { featureFlags: { petPhotosEnabled: true } });

    // Click Photos tab
    const photosTab = screen.getByRole('tab', { name: /photos/i });
    await user.click(photosTab);

    await user.click(screen.getByText('Trigger Error'));

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleSpy.mockRestore();
  });
});

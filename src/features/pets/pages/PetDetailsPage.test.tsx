import { screen } from '@testing-library/react';
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

vi.mock('@features/pets/components/PetInfoTable', () => ({
  PetInfoTable: () => (
    <div data-testid="pet-info-table">Mocked PetInfoTable</div>
  ),
}));

vi.mock('@features/pets/components/PetActions', () => ({
  PetActions: ({
    onEdit,
    onDelete,
    deleteError,
    isDeleting,
  }: {
    onEdit: () => void;
    onDelete: () => void;
    deleteError?: string;
    isDeleting?: boolean;
  }) => (
    <div data-testid="pet-actions">
      <button onClick={onEdit}>Mock Edit</button>
      <button onClick={onDelete}>Mock Delete</button>
      {deleteError && <span data-testid="delete-error">{deleteError}</span>}
      {isDeleting && <span data-testid="is-deleting">Deleting...</span>}
    </div>
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

vi.mock('@features/medications/pages/PetMedicationsPage', () => ({
  PetMedicationsPage: () => (
    <div data-testid="pet-medications-page">Mocked PetMedicationsPage</div>
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
      feedingsEnabled: !!flags.feedingsEnabled,
      medicationsEnabled: !!flags.medicationsEnabled,
      feedings: [],
      isFetchingFeedings: false,
      handleAddFeeding: vi.fn(),
      handleDeleteFeeding: vi.fn(),
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

  test('renders pet name as the header', async () => {
    const pet = makePet({ id: '1', name: 'Buddy', breed: 'Labrador' });

    const { PetDetailsPage, render } = await setup({
      pets: [pet],
      flags: {
        vetsEnabled: false,
        vetLinkingEnabled: false,
        petActionsEnabled: false,
      },
    });

    render(<PetDetailsPage />);

    const header = await screen.findByRole('heading', { name: 'Buddy' });
    expect(header).toBeInTheDocument();
  });

  test('renders the pet info table', async () => {
    const pet = makePet({ id: '1', name: 'Buddy', breed: 'Labrador' });

    const { PetDetailsPage, render } = await setup({
      pets: [pet],
      flags: {
        vetsEnabled: false,
        vetLinkingEnabled: false,
        petActionsEnabled: false,
      },
    });

    render(<PetDetailsPage />);

    expect(await screen.findByTestId('pet-info-table')).toBeInTheDocument();
  });

  test.each([
    { petActionsEnabled: true, action: 'shows', shouldShow: true },
    { petActionsEnabled: false, action: 'hides', shouldShow: false },
  ])(
    '$action PetActions when petActionsEnabled is $petActionsEnabled',
    async ({ petActionsEnabled, shouldShow }) => {
      const { PetDetailsPage, render } = await setup({
        pets: [makePet({ id: '1' })],
        flags: { petActionsEnabled: petActionsEnabled },
      });

      render(<PetDetailsPage />, {
        featureFlags: { petActionsEnabled: petActionsEnabled },
      });

      const petActionsComponent = screen.queryByTestId('pet-actions');

      if (shouldShow) {
        expect(petActionsComponent).toBeInTheDocument();
      } else {
        expect(petActionsComponent).not.toBeInTheDocument();
      }
    }
  );

  test('navigates to edit page when Edit is clicked', async () => {
    const { navigate, PetDetailsPage, render, user } = await setup({
      pets: [makePet({ id: '1' })],
      flags: { petActionsEnabled: true },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    await user.click(await screen.findByText('Mock Edit'));

    expect(navigate).toHaveBeenCalledWith('/pets/1/edit');
  });

  test('calls handleDelete when Delete is clicked', async () => {
    const { PetDetailsPage, render, user, handleDeleteMock } = await setup({
      pets: [makePet({ id: '1' })],
      flags: { petActionsEnabled: true },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    await user.click(await screen.findByText('Mock Delete'));

    expect(handleDeleteMock).toHaveBeenCalled();
  });

  test('passes delete error to PetActions', async () => {
    const { PetDetailsPage, render } = await setup({
      pets: [makePet({ id: '1' })],
      flags: { petActionsEnabled: true },
      hookOverrides: { error: 'Delete failed' },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    expect(await screen.findByTestId('delete-error')).toHaveTextContent(
      'Delete failed'
    );
  });

  test('passes isDeleting to PetActions', async () => {
    const { PetDetailsPage, render } = await setup({
      pets: [makePet({ id: '1' })],
      flags: { petActionsEnabled: true },
      hookOverrides: { saving: true },
    });

    render(<PetDetailsPage />, { featureFlags: { petActionsEnabled: true } });

    expect(await screen.findByTestId('is-deleting')).toBeInTheDocument();
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

  test('Back link points to /pets', async () => {
    const pet = makePet({ id: '1', name: 'Buddy' });
    const { PetDetailsPage, render } = await setup({ pets: [pet] });

    render(<PetDetailsPage />);

    const backLink = await screen.findByRole('link', { name: /back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/pets');
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

  test('renders PetMedicationsPage when medicationsEnabled=true', async () => {
    const pet = makePet({ id: '1' });

    const { PetDetailsPage, render, user } = await setup({
      pets: [pet],
      flags: { medicationsEnabled: true },
    });

    render(<PetDetailsPage />, { featureFlags: { medicationsEnabled: true } });

    // Click Medications tab
    const medicationsTab = screen.getByRole('tab', { name: /medications/i });
    await user.click(medicationsTab);

    // Should show PetMedicationsPage (mocked)
    expect(
      await screen.findByTestId('pet-medications-page')
    ).toBeInTheDocument();
  });

  test('hides Medications tab when medicationsEnabled=false', async () => {
    const pet = makePet({ id: '1' });

    const { PetDetailsPage, render } = await setup({
      pets: [pet],
      flags: { medicationsEnabled: false },
    });

    render(<PetDetailsPage />, { featureFlags: { medicationsEnabled: false } });

    expect(
      screen.queryByRole('tab', { name: /medications/i })
    ).not.toBeInTheDocument();
  });
});

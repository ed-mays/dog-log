import { vi, type Mock } from 'vitest';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { installPetsStoreMock } from '@testUtils/mocks/mockStoreInstallers';
import { makePet } from '@testUtils/factories/makePet';
import { usePetDetails } from '@features/pets/hooks/usePetDetails';
import { routerState } from '@testUtils/mocks/mockRouter';
import type { Pet } from '@features/pets/types';
import { render } from '@test-utils';

// Mock usePetDetails globally with override capability
export const mockUsePetDetails = vi.fn();
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

export async function setupPetDetailsPageTest(
  options: {
    petId?: string;
    pets?: Pet[];
    storeOverrides?: Record<string, unknown>;
    flags?: Record<string, boolean>;
    hookOverrides?: Partial<ReturnType<typeof usePetDetails>>;
  } = {}
): Promise<{
  petsMock: ReturnType<typeof installPetsStoreMock>;
  navigate: Mock;
  PetDetailsPage: React.ComponentType;
  render: typeof render;
  user: UserEvent;
  flags: Record<string, boolean>;
  handleDeleteMock: Mock;
}> {
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

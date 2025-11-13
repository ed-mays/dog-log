import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@test-utils';
import type { Pet } from '@features/pets/types';
import type { Vet, PetVetLink } from '@models/vets';
import type { AuthState } from '@store/auth.store';

vi.mock('@store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));
vi.mock('@services/petVetService', () => ({
  petVetService: {
    getPetVets: vi.fn(),
    linkVetToPet: vi.fn(),
    unlinkVetFromPet: vi.fn(),
  },
}));
// Replace VetSelector with a simple button that triggers onSelect
vi.mock('@features/veterinarians/components/VetSelector', () => ({
  __esModule: true,
  default: ({
    onSelect,
    label,
  }: {
    onSelect: (v: unknown) => void;
    label?: string;
  }) => (
    <button
      onClick={() =>
        onSelect({ id: 'v42', name: 'Dr. Link', phone: '555-4242' })
      }
    >
      {label ?? 'Link veterinarian'}
    </button>
  ),
}));

import { useAuthStore } from '@store/auth.store';
import { petVetService } from '@services/petVetService';
import { PetForm } from './PetForm';

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
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

describe('PetForm linking UI', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useAuthStore).mockImplementation(
      (sel: (s: AuthState) => unknown) =>
        sel({
          user: { uid: 'user1' },
          initializing: false,
          error: null,
          initAuthListener: () => () => {},
          signInWithGoogle: async () => {},
          signOut: async () => {},
          reset: () => {},
        })
    );
    vi.mocked(petVetService.getPetVets).mockResolvedValue(
      [] as Array<{ link: PetVetLink; vet: Vet }>
    );
    vi.mocked(petVetService.linkVetToPet).mockResolvedValue({
      id: 'l1',
      petId: 'p1',
      vetId: 'v42',
      role: 'primary',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'user1',
    } as PetVetLink);
    vi.mocked(petVetService.unlinkVetFromPet).mockResolvedValue(undefined);
  });

  it('renders linking section when flags enabled and allows add/remove vet link', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <PetForm
        initialValues={makePet()}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
      {
        featureFlags: { vetsEnabled: true, vetLinkingEnabled: true },
      }
    );

    // Section title visible (i18n-backed)
    const section = await screen.findByRole('heading', {
      name: /linked veterinarians/i,
    });
    expect(section).toBeInTheDocument();

    // Click our mocked VetSelector button to "link" a vet
    const linkBtn = screen.getByRole('button', { name: /link veterinarian/i });
    const user = userEvent.setup();
    await user.click(linkBtn);

    // Chip appears with vet name text
    const chipLabel = await screen.findByText(/dr\. link/i);
    expect(chipLabel).toBeInTheDocument();

    // Delete the link via the Chip's delete button (IconButton with aria-label Remove)
    const removeBtn = screen.getByRole('button', { name: /remove/i });
    await user.click(removeBtn);

    expect(petVetService.unlinkVetFromPet).toHaveBeenCalledWith('user1', 'l1');
  });
});

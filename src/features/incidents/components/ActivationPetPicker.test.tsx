import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivationPetPicker } from './ActivationPetPicker';
import { useIncidentStore, type IncidentState } from '@store/useIncidentStore';
import { usePetsStore } from '@store/pets.store';
import type { Pet } from '@features/pets/types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@store/useIncidentStore');
vi.mock('@store/pets.store');

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'pet-1',
    name: 'Buddy',
    breed: 'Lab',
    birthDate: new Date('2020-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    isArchived: false,
    photos: [],
    ...overrides,
  };
}

function setupPets(pets: Pet[]) {
  vi.mocked(usePetsStore).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: any) => (selector ? selector({ pets }) : { pets })
  );
}

describe('ActivationPetPicker (BR-28, DQ-7)', () => {
  const mockStartIncident = vi.fn().mockResolvedValue(undefined);
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIncidentStore).mockReturnValue({
      startIncident: mockStartIncident,
    } as unknown as IncidentState);
    setupPets([]);
  });

  it('shows all user pets in the list', () => {
    setupPets([
      makePet({ id: 'pet-1', name: 'Buddy' }),
      makePet({ id: 'pet-2', name: 'Luna' }),
    ]);
    render(<ActivationPetPicker open onClose={mockOnClose} />);

    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
  });

  it('tapping a pet calls startIncident with that petId and navigates to /incidents/active (AC-19)', async () => {
    const user = userEvent.setup();
    setupPets([makePet({ id: 'pet-42', name: 'Rex' })]);

    render(<ActivationPetPicker open onClose={mockOnClose} />);
    await user.click(screen.getByRole('button', { name: /Rex/ }));

    expect(mockStartIncident).toHaveBeenCalledWith({ petId: 'pet-42' });
    expect(mockNavigate).toHaveBeenCalledWith('/incidents/active');
  });

  // Pushback fix: ListItemAvatar is unconditional — both photo and no-photo pets
  // must render with consistent layout/spacing (never absent from DOM).
  it('renders Avatar with photo URL for pet with mainPhotoUrl', () => {
    setupPets([
      makePet({
        id: 'pet-1',
        name: 'Buddy',
        mainPhotoUrl: 'https://example.com/buddy.jpg',
      }),
    ]);
    render(<ActivationPetPicker open onClose={mockOnClose} />);

    const img = screen.getByRole('img', { name: 'Buddy' });
    expect(img).toHaveAttribute('src', 'https://example.com/buddy.jpg');
  });

  it('renders Avatar with first-letter fallback for pet without mainPhotoUrl (ListItemAvatar still present)', () => {
    setupPets([makePet({ id: 'pet-2', name: 'Luna' })]);

    render(<ActivationPetPicker open onClose={mockOnClose} />);

    expect(screen.getByText('L')).toBeInTheDocument();
    // Button is still rendered — ListItemAvatar occupies its layout slot
    expect(screen.getByRole('button', { name: /Luna/ })).toBeInTheDocument();
  });
});

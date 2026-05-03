import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VetCallCard } from './VetCallCard';
import { usePetVetsStore } from '@store/petVets.store';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@store/petVets.store');

const fakeStoreWithPrimary = {
  byPetId: {
    'pet-1': {
      links: [
        {
          link: {
            id: 'link-1',
            petId: 'pet-1',
            vetId: 'vet-1',
            role: 'primary' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user-1',
          },
          vet: {
            id: 'vet-1',
            ownerUserId: 'user-1',
            name: 'Dr. Smith',
            phone: '+15551234567',
            _normName: 'dr. smith',
            _e164Phone: '+15551234567',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user-1',
          },
        },
      ],
      loading: false,
      error: null,
    },
  },
};

describe('VetCallCard (AC-5, BR-10, BR-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-5: Given pet has primary vet with phone, When caregiver taps call action, Then tel: link renders with correct number', () => {
    vi.mocked(usePetVetsStore).mockReturnValue(fakeStoreWithPrimary as never);

    render(<VetCallCard petId="pet-1" />);

    const link = screen.getByRole('link', { name: /incidents.callVet/i });
    expect(link).toHaveAttribute('href', 'tel:+15551234567');
  });

  it('BR-11: Given pet has no linked vets, Then component renders nothing', () => {
    vi.mocked(usePetVetsStore).mockReturnValue({
      byPetId: {},
    } as never);

    render(<VetCallCard petId="pet-1" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('BR-11: Given pet has vets but none is primary, Then component renders nothing', () => {
    vi.mocked(usePetVetsStore).mockReturnValue({
      byPetId: {
        'pet-1': {
          links: [
            {
              link: {
                id: 'link-1',
                petId: 'pet-1',
                vetId: 'vet-1',
                role: 'specialist' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'user-1',
              },
              vet: {
                id: 'vet-1',
                ownerUserId: 'user-1',
                name: 'Dr. Jones',
                phone: '+15559876543',
                _normName: 'dr. jones',
                _e164Phone: '+15559876543',
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'user-1',
              },
            },
          ],
          loading: false,
          error: null,
        },
      },
    } as never);

    render(<VetCallCard petId="pet-1" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

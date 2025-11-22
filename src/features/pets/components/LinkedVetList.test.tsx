import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LinkedVetList } from './LinkedVetList';
import { BrowserRouter } from 'react-router-dom';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key.startsWith('link.role.')) return key.split('.').pop();
      if (key === 'loading') return 'Loading…';
      if (key === 'noLinkedVets') return 'No linked veterinarians';
      return key;
    },
  }),
}));

import type { PetVetLink, Vet } from '@models/vets';

describe('LinkedVetList', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  it('shows loading state', () => {
    renderWithRouter(<LinkedVetList loading={true} links={[]} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows empty state when not loading and no links', () => {
    renderWithRouter(<LinkedVetList loading={false} links={[]} />);
    expect(screen.getByText('No linked veterinarians')).toBeInTheDocument();
  });

  it('renders list of vets when links are provided', () => {
    const links = [
      {
        link: { id: 'l1', role: 'primary' } as PetVetLink,
        vet: { id: 'v1', name: 'Dr. Smith' } as Vet,
      },
      {
        link: { id: 'l2', role: 'other' } as PetVetLink,
        vet: { id: 'v2', name: 'Dr. Jones' } as Vet,
      },
    ];

    renderWithRouter(<LinkedVetList loading={false} links={links} />);

    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();
  });
});

import { screen } from '@testing-library/react';
import { render } from '@test-utils';
import { makePet } from '@testUtils/factories/makePet';
import PetCard from './PetCard';

describe('PetCard', () => {
  test('renders provided pet name and breed within the MUI card structure', () => {
    const pet = makePet({ name: 'Buddy', breed: 'Labrador' });
    render(<PetCard pet={pet} />);

    // Header image exists
    const img = screen.getByRole('img', { name: /pet header/i });
    expect(img).toBeInTheDocument();

    // Name displayed as a heading (Typography with component h3)
    const nameHeading = screen.getByRole('heading', {
      name: 'Buddy',
      level: 3,
    });
    expect(nameHeading).toBeInTheDocument();

    // Breed text displayed
    expect(screen.getByText('Labrador')).toBeInTheDocument();
  });
});

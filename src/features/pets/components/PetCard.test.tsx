import { screen } from '@testing-library/react';
import { render } from '@test-utils';
import PetCard from './PetCard';

describe('PetCard', () => {
  test('PetCard renders without crashing', () => {
    render(<PetCard />);
    expect(screen.getByText('Pet Card')).toBeInTheDocument();
  });
});

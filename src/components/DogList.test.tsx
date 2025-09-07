// src/components/DogList.test.tsx
import { render, screen } from '@testing-library/react';
import { DogList } from './DogList';
import type { Dog } from './DogList';

const testDogs: Dog[] = [
  { id: '1', name: 'Fido', breed: 'Labrador' },
  { id: '2', name: 'Bella', breed: 'Beagle' },
];

test('renders a list of dogs', () => {
  render(<DogList dogs={testDogs} />);
  expect(screen.getByText('Fido (Labrador)')).toBeInTheDocument();
  expect(screen.getByText('Bella (Beagle)')).toBeInTheDocument();
});

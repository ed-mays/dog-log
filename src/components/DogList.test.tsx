// src/components/DogList.test.tsx
import { render, screen, within } from '@testing-library/react';
import { DogList } from './DogList';
import type { Dog } from './DogList';
import { test } from 'vitest';

const testDogs: Dog[] = [
  { id: '1', name: 'Fido', breed: 'Labrador' },
  { id: '2', name: 'Bella', breed: 'Beagle' },
];

test('renders a table with headers', () => {
  render(<DogList dogs={testDogs} />);
  // Table and column headers
  const table = screen.getByRole('table');
  expect(table).toBeInTheDocument();

  const headerRow = screen.getByRole('row', { name: /Name Breed/i });
  expect(within(headerRow).getByText('Name')).toBeInTheDocument();
  expect(within(headerRow).getByText('Breed')).toBeInTheDocument();
});

test('renders default data-testid', async () => {
  render(<DogList dogs={testDogs} />);
  expect(screen.getByTestId('dog-list')).toBeInTheDocument();
});

test('renders a custom data-testid', async () => {
  render(<DogList dogs={testDogs} data-TestId="custom-test-id" />);
  expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
});

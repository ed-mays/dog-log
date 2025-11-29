import { screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { render } from '@test-utils';
import { PetInfoTable } from './PetInfoTable';
import { makePet } from '@testUtils/factories/makePet';

describe('PetInfoTable', () => {
  test('renders pet information correctly', () => {
    const pet = makePet({ name: 'Buddy', breed: 'Golden Retriever' });
    render(<PetInfoTable pet={pet} />);

    expect(
      screen.getByRole('table', { name: /pet info/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
  });
});

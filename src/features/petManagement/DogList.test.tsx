import { render, screen, within } from '@testing-library/react';
import { DogList } from './DogList.tsx';
import i18n from './mocki18n.tsx';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, test } from 'vitest';
import type { Dog } from './dogListTypes.tsx';

const testDogs: Dog[] = [
  { id: '1', name: 'Fido', breed: 'Labrador' },
  { id: '2', name: 'Bella', breed: 'Beagle' },
];

beforeEach(() => {
  i18n.changeLanguage('en');
});

const cases = [
  { locale: 'en', expectedNameHeader: 'Name', expectedBreedHeader: 'Breed' },
  { locale: 'es', expectedNameHeader: 'Nombre', expectedBreedHeader: 'Raza' },
];
test.each(cases)(
  'renders translated headers for $locale locale',
  ({ locale, expectedNameHeader, expectedBreedHeader }) => {
    i18n.changeLanguage(locale);
    render(
      <I18nextProvider i18n={i18n}>
        <DogList dogs={testDogs} />
      </I18nextProvider>
    );
    expect(screen.getByText(expectedNameHeader)).toBeInTheDocument();
    expect(screen.getByText(expectedBreedHeader)).toBeInTheDocument();
  }
);

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

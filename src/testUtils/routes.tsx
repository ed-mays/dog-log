import { screen } from '@testing-library/react';

/**
 * Common route/page assertions to keep tests intention-revealing and DRY.
 * Prefer these over repeating the same selectors across multiple suites.
 */

export async function expectWelcomePage() {
  await screen.findByRole('heading', { name: /welcome/i });
}

export async function expectFeatureUnavailable() {
  expect(await screen.findByText('Feature not enabled')).toBeInTheDocument();
}

export async function expectPetListVisible() {
  expect(await screen.findByTestId('pet-list')).toBeInTheDocument();
}

export async function expectNotFoundPage() {
  expect(await screen.findByTestId('not-found-page')).toBeInTheDocument();
  expect(
    await screen.findByRole('heading', { name: /not found/i })
  ).toBeInTheDocument();
}

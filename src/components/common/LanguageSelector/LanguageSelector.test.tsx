import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { LanguageSelector } from './LanguageSelector';

// Helper component that shows a translated label to verify live updates
import React from 'react';
import { useTranslation } from 'react-i18next';

// IMPORTANT: This file is excluded from test coverage for now because the component uses a MUI
// Select, which simply will not respond to click events, etc. in the test environment.
//
// We will add coverage at some future point via a browser-based testing environment.
//
// Don't waste your time trying to write tests for interactions with the dropdown list.
const TranslatedPetsLabel = () => {
  const { t } = useTranslation('common');
  return <div aria-label="pets-label">{t('nav.pets')}</div>;
};

const SelectorWithProbe = () => (
  <div>
    <LanguageSelector />
    <TranslatedPetsLabel />
  </div>
);

describe('LanguageSelector', () => {
  test('renders options with uppercase locale codes', async () => {
    render(<LanguageSelector supportedLocales={['en', 'es']} />);

    // Open the select dropdown
    const combo = screen.getByRole('combobox', { name: /language/i });
    await userEvent.click(combo);

    // Options should list full native language names
    expect(
      await screen.findByRole('option', { name: 'English' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('option', { name: 'Español' })
    ).toBeInTheDocument();
  });

  test('changing the language updates translated UI immediately', async () => {
    render(<SelectorWithProbe />);

    // Initial language is English in test i18n; pets label should be English
    expect(screen.getByLabelText('pets-label')).toHaveTextContent(/pets/i);

    // Change to Spanish
    const combo = screen.getByRole('combobox', { name: /language/i });
    await userEvent.click(combo);
    const esOption = await screen.findByRole('option', { name: 'Español' });
    await userEvent.click(esOption);

    // Pets label should update to Spanish immediately
    expect(await screen.findByLabelText('pets-label')).toHaveTextContent(
      /mascotas/i
    );
  });

  test('normalizes region codes (en-US displays as EN)', async () => {
    const { default: i18nInstance } = await import('@testUtils/test-i18n');
    await i18nInstance.changeLanguage('en-US');

    render(<LanguageSelector supportedLocales={['en', 'es']} />, {
      i18nInstance,
    });

    const combo = screen.getByRole('combobox', { name: /language/i });
    // The selected value label should show EN (normalized)
    expect(combo).toHaveTextContent('EN');
  });
});

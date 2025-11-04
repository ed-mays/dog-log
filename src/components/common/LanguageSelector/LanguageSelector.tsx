import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { preloadLanguage } from '@i18n';

export type LanguageSelectorProps = {
  supportedLocales?: string[];
  labelId?: string;
};

// Map base locale to a representative flag emoji (extensible)
const LOCALE_FLAGS: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
};

// Map base locale to a human-friendly language name (non-translated, for selector UI)
const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Español',
};

const baseOf = (lng: string): string => (lng || 'en').split('-')[0];

const flagFor = (lng: string): string => {
  const base = baseOf(lng);
  return LOCALE_FLAGS[base] ?? '🏳️';
};

const nameFor = (lng: string): string => {
  const base = baseOf(lng);
  return LOCALE_NAMES[base] ?? base.toUpperCase();
};

// Simple, extensible language selector using i18next
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  supportedLocales = ['en', 'es'],
  labelId = 'language-selector-label',
}) => {
  const { i18n, t } = useTranslation('common');

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const next = event.target.value;
    // Normalize current to base code to compare with option values
    const currentBase = (i18n.resolvedLanguage || i18n.language || '').split(
      '-'
    )[0];
    if (next && next !== currentBase) {
      // Ensure all namespaces for the target language are loaded before switching
      await preloadLanguage(next);
      await i18n.changeLanguage(next);
    }
  };

  // Normalize to base locale (e.g., en-US -> en) to match supported options
  const resolved = (i18n.resolvedLanguage ||
    i18n.language ||
    supportedLocales[0]) as string;
  const current = resolved.split('-')[0];

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id={labelId}>{t('nav.language', 'Language')}</InputLabel>
      <Select
        labelId={labelId}
        label={t('nav.language', 'Language')}
        value={current}
        onChange={handleChange}
        aria-label={t('nav.language', 'Language')}
        // MUI Select has role="button" but ARIA role is combobox in testing-library
        data-testid="language-selector"
        renderValue={(value) => (
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span aria-hidden="true">{flagFor(String(value))}</span>
            <span>{String(value).toUpperCase()}</span>
          </span>
        )}
      >
        {supportedLocales.map((lng) => (
          <MenuItem key={lng} value={lng} aria-label={nameFor(lng)}>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span aria-hidden="true">{flagFor(lng)}</span>
              <span>{nameFor(lng)}</span>
            </span>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;

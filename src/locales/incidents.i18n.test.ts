/**
 * Verifies T-05 (i18n key scaffolding) per spec NFR-5 and design §D6.
 *
 * Asserts that all `incidents.*` keys defined in §D6 (excluding chip-specific
 * ones — those are reserved for T-20 / DQ-5) resolve via `useTranslation` for
 * both `en` and `es` without missing-key warnings.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './en/common.json';
import esCommon from './es/common.json';

// Keys from §D6 except `incidents.chips.*` (T-20). Interpolation params are
// supplied where the design template includes `{{...}}` so the rendered string
// is non-empty and free of placeholders.
const KEYS: ReadonlyArray<{ key: string; opts?: Record<string, unknown> }> = [
  { key: 'incidents.activate' },
  { key: 'incidents.activeBadge' },
  { key: 'incidents.timer.running', opts: { elapsed: '00:42' } },
  { key: 'incidents.timer.duration', opts: { duration: '01:15' } },
  { key: 'incidents.severity.mild' },
  { key: 'incidents.severity.moderate' },
  { key: 'incidents.severity.severe' },
  { key: 'incidents.callVet' },
  { key: 'incidents.stop' },
  { key: 'incidents.stopSubcaption' },
  { key: 'incidents.petPickerTitle' },
  { key: 'incidents.petPickerHelp' },
  { key: 'incidents.petPickerCancel' },
  { key: 'incidents.journal.label' },
  { key: 'incidents.journal.auto' },
  { key: 'incidents.journal.placeholder' },
  { key: 'incidents.history.title' },
  { key: 'incidents.history.empty' },
  { key: 'incidents.history.untyped' },
  // history.noJournal is intentionally an empty string per §D6
  { key: 'incidents.history.noJournal' },
  { key: 'incidents.types.seizure' },
  { key: 'incidents.types.injury' },
  { key: 'incidents.types.vomiting' },
  { key: 'incidents.types.choking' },
  { key: 'incidents.types.allergic_reaction' },
  { key: 'incidents.types.collapse' },
  { key: 'incidents.types.ingestion' },
  { key: 'incidents.types.other' },
];

const missingKeyHandler = vi.fn();

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    resources: {
      en: { common: enCommon },
      es: { common: esCommon },
    },
    interpolation: { escapeValue: false },
    saveMissing: true,
    missingKeyHandler,
  });
});

describe('§D6 incidents i18n keys', () => {
  it.each(KEYS)('resolves $key in en', ({ key, opts }) => {
    const value = i18n.getFixedT('en', 'common')(key, opts);
    // Empty string is allowed (history.noJournal is intentionally ""), but the
    // returned value MUST NOT equal the key — that is i18next's missing-key
    // fallback signal.
    expect(value).not.toBe(key);
    if (typeof opts === 'object' && opts) {
      // No unresolved interpolation placeholders.
      expect(value).not.toMatch(/\{\{.*\}\}/);
    }
  });

  it.each(KEYS)('resolves $key in es', ({ key, opts }) => {
    const value = i18n.getFixedT('es', 'common')(key, opts);
    expect(value).not.toBe(key);
    if (typeof opts === 'object' && opts) {
      expect(value).not.toMatch(/\{\{.*\}\}/);
    }
  });

  it('does not register any missing-key warnings for the §D6 keys', () => {
    missingKeyHandler.mockClear();
    for (const { key, opts } of KEYS) {
      i18n.getFixedT('en', 'common')(key, opts);
      i18n.getFixedT('es', 'common')(key, opts);
    }
    expect(missingKeyHandler).not.toHaveBeenCalled();
  });
});

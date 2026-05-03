/**
 * Verifies T-20 (chip i18n keys) per spec NFR-5 and design §D6.
 *
 * Asserts that every `incidents.chips.*` key (one per ChipId from §D5 / chipCatalog.ts)
 * resolves via `useTranslation` for both `en` and `es` without missing-key warnings.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './en/common.json';
import esCommon from './es/common.json';

// One entry per unique ChipId from src/features/incidents/chipCatalog.ts (§D5).
// No interpolation params needed — chip labels are plain strings.
const CHIP_KEYS: ReadonlyArray<string> = [
  'incidents.chips.rigid',
  'incidents.chips.salivating',
  'incidents.chips.unconscious',
  'incidents.chips.vocalizing',
  'incidents.chips.paddling',
  'incidents.chips.incontinence',
  'incidents.chips.blind',
  'incidents.chips.thirsty',
  'incidents.chips.bleeding',
  'incidents.chips.limping',
  'incidents.chips.swelling',
  'incidents.chips.exposed_wound',
  'incidents.chips.foreign_object',
  'incidents.chips.food',
  'incidents.chips.bile',
  'incidents.chips.blood',
  'incidents.chips.foam',
  'incidents.chips.undigested',
  'incidents.chips.repeated',
  'incidents.chips.coughing',
  'incidents.chips.gagging',
  'incidents.chips.blue_gums',
  'incidents.chips.panicking',
  'incidents.chips.object_visible',
  'incidents.chips.collapsed',
  'incidents.chips.facial_swelling',
  'incidents.chips.hives',
  'incidents.chips.itching',
  'incidents.chips.vomiting',
  'incidents.chips.breathing_difficulty',
  'incidents.chips.lethargy',
  'incidents.chips.unresponsive',
  'incidents.chips.brief_loss',
  'incidents.chips.weak_pulse',
  'incidents.chips.pale_gums',
  'incidents.chips.recovered_quickly',
  'incidents.chips.known_substance',
  'incidents.chips.unknown_substance',
  'incidents.chips.vomited_already',
  'incidents.chips.lethargic',
  'incidents.chips.drooling',
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

describe('§D6 incidents.chips i18n keys (T-20)', () => {
  it.each(CHIP_KEYS)('resolves %s in en', (key) => {
    const value = i18n.getFixedT('en', 'common')(key);
    expect(value).not.toBe(key);
  });

  it.each(CHIP_KEYS)('resolves %s in es', (key) => {
    const value = i18n.getFixedT('es', 'common')(key);
    expect(value).not.toBe(key);
  });

  it('does not register any missing-key warnings for chip keys', () => {
    missingKeyHandler.mockClear();
    for (const key of CHIP_KEYS) {
      i18n.getFixedT('en', 'common')(key);
      i18n.getFixedT('es', 'common')(key);
    }
    expect(missingKeyHandler).not.toHaveBeenCalled();
  });
});

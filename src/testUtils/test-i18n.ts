import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Shared test i18n instance using real app locale JSONs to ensure parity
// Imports: keep in sync with src/locales/<lang>/<namespace>.json
import enCommon from '../locales/en/common.json';
import enPetList from '../locales/en/petList.json';
import enPetProperties from '../locales/en/petProperties.json';
import enPetDetails from '../locales/en/petDetails.json';
import enAuth from '../locales/en/auth.json';

import esCommon from '../locales/es/common.json';
import esPetList from '../locales/es/petList.json';
import esPetProperties from '../locales/es/petProperties.json';
import esPetDetails from '../locales/es/petDetails.json';
import esAuth from '../locales/es/auth.json';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'petList', 'petProperties', 'auth', 'petDetails'],
    defaultNS: 'common',
    resources: {
      en: {
        common: enCommon,
        petList: enPetList,
        petProperties: enPetProperties,
        auth: enAuth,
        petDetails: enPetDetails,
      },
      es: {
        common: esCommon,
        petList: esPetList,
        petProperties: esPetProperties,
        auth: esAuth,
        petDetails: esPetDetails,
      },
    },
    interpolation: { escapeValue: false },
  });
}

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import homeEN from './locales/en/home.json';
import commonEN from './locales/en/common.json';
import dogListEN from './locales/en//dogList.json';

import homeES from './locales/es/home.json';
import commonES from './locales/es/common.json';
import dogListES from './locales/es/dogList.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { common: commonEN, home: homeEN, dogList: dogListEN },
    es: { common: commonES, home: homeES, dogList: dogListES },
  },
  lng: import.meta.env.VITE_DEFAULT_LOCALE,
  fallbackLng: 'en',
  ns: ['common', 'home', 'dogList'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});
export default i18n;

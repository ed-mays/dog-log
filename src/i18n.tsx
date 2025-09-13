import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import homeEN from './locales/en/home.json';
import commonEN from './locales/en/common.json';
import petListEN from './locales/en/petList.json';

import homeES from './locales/es/home.json';
import commonES from './locales/es/common.json';
import petListES from './locales/es/petList.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { common: commonEN, home: homeEN, petList: petListEN },
    es: { common: commonES, home: homeES, petList: petListES },
  },
  lng: import.meta.env.VITE_DEFAULT_LOCALE,
  fallbackLng: 'en',
  ns: ['common', 'home', 'petList'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});
export default i18n;

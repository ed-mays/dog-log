import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Boot with only the critical 'common' namespace to keep initial bundle small
import commonEN from './locales/en/common.json';
import commonES from './locales/es/common.json';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEN,
    },
    es: {
      common: commonES,
    },
  },
  lng: import.meta.env.VITE_DEFAULT_LOCALE,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

// Helper to lazy-load a namespace at runtime
export async function loadNamespace(ns: string, lng: string = i18n.language) {
  // Dynamically import the JSON for the requested namespace and language
  const mod = await import(`./locales/${lng}/${ns}.json`);
  i18n.addResourceBundle(lng, ns, (mod as any).default ?? mod, true, true);
  return ns;
}

export default i18n;

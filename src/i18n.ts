import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
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
  i18n.addResourceBundle(lng, ns, mod.default ?? mod, true, true);
  return ns;
}

export default i18n;

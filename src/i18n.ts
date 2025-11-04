import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Persisted language key (aligns with i18next-browser-languagedetector default)
const PERSIST_KEY = 'i18nextLng';
const envDefault = import.meta.env?.VITE_DEFAULT_LOCALE as string | undefined;
const saved =
  typeof window !== 'undefined'
    ? (window.localStorage.getItem(PERSIST_KEY) ?? undefined)
    : undefined;
const initialLng = (saved || envDefault || 'en').split('-')[0];

// Keep an authoritative list of app namespaces in one place
export const APP_NAMESPACES = [
  'common',
  'petList',
  'petProperties',
  'auth',
] as const;

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: 'en',
  ns: APP_NAMESPACES as unknown as string[],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

// Helper to lazy-load a namespace at runtime
export async function loadNamespace(ns: string, lng: string = i18n.language) {
  const baseLng = (lng || 'en').split('-')[0];
  // Dynamically import the JSON for the requested namespace and language
  const mod = await import(`./locales/${baseLng}/${ns}.json`);
  const bundle = mod as { default: unknown } | unknown as { default?: unknown };
  i18n.addResourceBundle(
    baseLng,
    ns,
    (bundle.default ?? bundle) as object,
    true,
    true
  );
  return ns;
}

// Helper to ensure all app namespaces are available for a given language
export async function preloadLanguage(
  lng: string,
  namespaces: readonly string[] = APP_NAMESPACES
) {
  const baseLng = (lng || 'en').split('-')[0];
  await Promise.all(namespaces.map((ns) => loadNamespace(ns, baseLng)));
}

// Preload all namespaces for the initial language
void preloadLanguage(initialLng);

i18n.on('languageChanged', (lng) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PERSIST_KEY, lng);
    }
  } catch {
    // ignore storage errors
  }
  // Ensure all namespaces are present for the new language
  void preloadLanguage(lng);
});

export default i18n;

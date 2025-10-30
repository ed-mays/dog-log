import type { i18n as I18nInstance } from 'i18next';
import defaultI18n from '@testUtils/test-i18n';

/**
 * Run a test block under a specific locale, then restore the previous locale.
 *
 * Usage:
 *   await withLocale('es', async () => {
 *     // assertions while i18n.language === 'es'
 *   });
 *
 * You may optionally pass a custom i18n instance (e.g., when rendering with a bespoke provider).
 */
export async function withLocale<T>(
  lng: string,
  fn: () => Promise<T> | T,
  i18nInstance: I18nInstance = defaultI18n
): Promise<T> {
  const previous = i18nInstance.language;
  await i18nInstance.changeLanguage(lng);
  try {
    return await fn();
  } finally {
    // Always restore previous language, even if the test block throws
    await i18nInstance.changeLanguage(previous);
  }
}

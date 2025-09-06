import React from 'react';
import { vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(() => Promise.resolve()),
      language: 'en',
      t: (key: string) => key,
    },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  withTranslation:
    () =>
    <P extends object>(Component: React.ComponentType<P>) =>
    (props: P) => (
      <Component
        t={(key: string) => key}
        i18n={{
          changeLanguage: vi.fn(),
          language: 'en',
          t: (key: string) => key,
        }}
        {...props}
      />
    ),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

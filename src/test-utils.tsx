import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import defaultI18n from '@testUtils/test-i18n';
import { FeatureFlagsProvider } from '@featureFlags/FeatureFlagsProvider';
import type { i18n } from 'i18next';

type AllTheProvidersProps = {
  children: React.ReactNode;
  i18nInstance?: i18n;
};

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({ children, i18nInstance }: AllTheProvidersProps) => (
  <FeatureFlagsProvider>
    <I18nextProvider i18n={i18nInstance ?? defaultI18n}>
      {children}
    </I18nextProvider>
  </FeatureFlagsProvider>
);

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  i18nInstance?: i18n;
};

const customRender = (
  ui: ReactElement,
  { i18nInstance, ...options }: CustomRenderOptions = {}
) =>
  render(ui, {
    wrapper: (props) => (
      <AllTheProviders {...props} i18nInstance={i18nInstance} />
    ),
    ...options,
  });

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { customRender as render };

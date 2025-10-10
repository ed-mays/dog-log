import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import defaultI18n from '@testUtils/test-i18n';
import { FeatureFlagsProvider } from '@featureFlags/components/FeatureFlagsProvider';
import type { FeatureFlags } from '@featureFlags/featureFlags.types';
import type { i18n } from 'i18next';
import { MemoryRouter } from 'react-router-dom';

type AllTheProvidersProps = {
  children: React.ReactNode;
  i18nInstance?: i18n;
  featureFlags?: Partial<FeatureFlags>;
  initialRoutes?: string[];
};

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({
  children,
  i18nInstance,
  featureFlags,
  initialRoutes,
}: AllTheProvidersProps) => (
  <MemoryRouter initialEntries={initialRoutes}>
    <FeatureFlagsProvider
      initialFlags={{
        petListEnabled: true,
        addPetEnabled: true,
        authEnabled: true,
        ...(featureFlags ?? {}),
      }}
    >
      <I18nextProvider i18n={i18nInstance ?? defaultI18n}>
        {children}
      </I18nextProvider>
    </FeatureFlagsProvider>
  </MemoryRouter>
);

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  i18nInstance?: i18n;
  featureFlags?: Partial<FeatureFlags>;
  initialRoutes?: string[];
};

const customRender = (
  ui: ReactElement,
  {
    i18nInstance,
    featureFlags,
    initialRoutes,
    ...options
  }: CustomRenderOptions = {}
) =>
  render(ui, {
    wrapper: (props) => (
      <AllTheProviders
        {...props}
        i18nInstance={i18nInstance}
        featureFlags={featureFlags}
        initialRoutes={initialRoutes}
      />
    ),
    ...options,
  });

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { customRender as render };

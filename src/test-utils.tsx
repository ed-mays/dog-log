import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import defaultI18n from '@testUtils/test-i18n';
import { FeatureFlagsProvider } from '@featureFlags/components/FeatureFlagsProvider';
import type { FeatureFlags } from '@featureFlags/types';
import type { i18n } from 'i18next';
import { MemoryRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

type AllTheProvidersProps = {
  children: React.ReactNode;
  i18nInstance?: i18n;
  featureFlags?: Partial<FeatureFlags>;
  initialRoutes?: string[];
};

const theme = createTheme({
  typography: {
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});

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
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
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
): ReturnType<typeof render> =>
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

export * from '@testing-library/react';
export { customRender as render };
export { withLocale } from '@testUtils/withLocale';

export const renderWithUser = (
  ui: ReactElement,
  options?: CustomRenderOptions
): ReturnType<typeof customRender> & {
  user: ReturnType<typeof userEvent.setup>;
} => {
  return {
    user: userEvent.setup(),
    ...customRender(ui, options),
  };
};

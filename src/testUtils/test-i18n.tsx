import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Shared test i18n instance for all tests
// Keep resources minimal and focused on test coverage needs
// Real app i18n setup may load from src/locales; tests can stub only used keys

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        petList: {
          addPet: 'Add Pet',
        },
        petProperties: {
          name: 'Name',
          breed: 'Breed',
        },
        common: {
          featureNotEnabled: 'Feature not enabled',
          somethingWentWrong: 'Something went wrong',
          firebaseErrors: {
            popupClosedByUser:
              'The sign-in popup was closed before completing.',
          },
          responses: {
            ok: 'OK',
            cancel: 'Cancel',
          },
          welcomePage: {
            welcomeHeader: 'Welcome',
            welcomeSubtitle: 'Sign in to continue',
          },
        },
      },
      es: {
        petList: {
          addPet: 'Agrega Mascota',
        },
        petProperties: {
          name: 'Nombre',
          breed: 'Raza',
        },
        common: {
          featureNotEnabled: 'Funcionalidad no habilitada',
          somethingWentWrong: 'Algo salió mal',
          responses: {
            ok: 'Aceptar',
            cancel: 'Cancelar',
          },
          welcomePage: {
            welcomeHeader: 'Bienvenido',
            welcomeSubtitle: 'Inicia sesión para continuar',
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });
}

export default i18n;

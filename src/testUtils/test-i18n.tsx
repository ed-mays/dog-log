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
          ok: 'OK',
          cancel: 'Cancel',
          featureNotEnabled: 'Feature not enabled',
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
          ok: 'Aceptar',
          cancel: 'Cancelar',
          featureNotEnabled: 'Funcionalidad no habilitada',
        },
      },
    },
    interpolation: { escapeValue: false },
  });
}

export default i18n;

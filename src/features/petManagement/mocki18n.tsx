import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
      },
    },
  },
});

export default i18n;

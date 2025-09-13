import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      dogList: { columnHeaders: { name: 'Name', breed: 'Breed' } },
    },
    es: {
      dogList: { columnHeaders: { name: 'Nombre', breed: 'Raza' } },
    },
  },
});

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      petList: { columnHeaders: { name: 'Name', breed: 'Breed' } },
    },
    es: {
      petList: { columnHeaders: { name: 'Nombre', breed: 'Raza' } },
    },
  },
});

export default i18n;

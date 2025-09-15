import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      petList: {
        addPet: 'Add Pet',
      },
      petProperties: {
        name: 'Name',
        breed: 'Breed',
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
    },
  },
});

export default i18n;

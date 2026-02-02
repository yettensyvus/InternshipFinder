import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import ro from './ro';
import ru from './ru';

const resources = {
  en: { translation: en },
  ro: { translation: ro },
  ru: { translation: ru }
};

const savedLng = localStorage.getItem('lng') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
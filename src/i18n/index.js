import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import de from './de.json';

// Auto-detect device language, fall back to English
const deviceLang = Localization.getLocales?.()?.[0]?.languageCode ?? 'en';
const supportedLang = deviceLang === 'de' ? 'de' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: supportedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });

export default i18n;

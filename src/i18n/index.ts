import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// @ts-ignore — JSON imports are fine, TS may complain about resolveJsonModule in some setups
import en from './en.json';
// @ts-ignore
import de from './de.json';

// Auto-detect device language, fall back to English
const deviceLang = Localization.getLocales?.()?.[0]?.languageCode ?? 'en';
const supportedLang = deviceLang === 'de' ? 'de' : 'en';

// @ts-ignore — i18next v23 types are stricter; options are valid at runtime
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
  } as any);

export default i18n;

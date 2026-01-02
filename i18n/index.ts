import { Language, LanguageConfig } from './types';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' }
];

export const DEFAULT_LANGUAGE: Language = 'es';

export const LANGUAGE_STORAGE_KEY = 'cartas-paulo-language';

// Lazy load translation files
export async function loadTranslations(language: Language) {
  try {
    const translations = await import(`./locales/${language}.json`);
    return translations.default;
  } catch (error) {
    console.warn(`Failed to load ${language} translations, falling back to Spanish`);
    const fallback = await import(`./locales/es.json`);
    return fallback.default;
  }
}

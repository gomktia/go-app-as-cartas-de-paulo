import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';
import { TranslationParams } from './types';

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }

  const { translations, language } = context;

  // Helper function to get nested translation by dot notation
  const t = (key: string, params?: TranslationParams): string => {
    if (!translations) return key;

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }

    if (typeof value !== 'string') return key;

    // Replace parameters like {title}
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) =>
        String(params[paramKey] ?? `{${paramKey}}`)
      );
    }

    return value;
  };

  return { t, language, ...context };
}

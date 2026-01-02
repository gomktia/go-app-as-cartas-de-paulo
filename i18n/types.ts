export type Language = 'pt' | 'es' | 'en' | 'fr';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export interface TranslationKeys {
  common: Record<string, string>;
  header: Record<string, string>;
  sections: Record<string, string>;
  buttons: Record<string, string>;
  alerts: Record<string, string>;
  modal: Record<string, string>;
  collection: Record<string, string>;
  chapters: Record<string, string>;
  admin: Record<string, string>;
  footer: Record<string, string>;
}

export type TranslationKey = string;
export type TranslationParams = Record<string, string | number>;

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationKeys } from './types';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, loadTranslations } from './index';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: TranslationKeys | null;
  isLoading: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<TranslationKeys | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (savedLanguage && ['pt', 'es', 'en', 'fr'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['pt', 'es', 'en', 'fr'].includes(browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    setIsLoading(true);
    loadTranslations(language)
      .then((trans) => {
        setTranslations(trans);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

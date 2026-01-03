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
  // FIXED: Always use Spanish (es) - no language switching
  const [language] = useState<Language>('es');
  const [translations, setTranslations] = useState<TranslationKeys | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Spanish translations only
  useEffect(() => {
    setIsLoading(true);
    loadTranslations('es')
      .then((trans) => {
        setTranslations(trans);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  // Dummy setLanguage - does nothing since language is fixed
  const setLanguage = (lang: Language) => {
    // Language is fixed to Spanish
    console.log('Language is fixed to Spanish (es)');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

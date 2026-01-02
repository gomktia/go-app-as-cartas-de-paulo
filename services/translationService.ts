import { supabase } from '../lib/supabaseClient';
import { geminiService } from './geminiService';
import { Language } from '../i18n/types';

export interface TranslationRequest {
  entityType: 'product' | 'chapter';
  entityId: string;
  fieldName: string;
  sourceText: string;
  targetLanguage: Language;
  context?: string;
}

class TranslationService {
  private cache: Map<string, string> = new Map();

  /**
   * Get cache key for a translation
   */
  private getCacheKey(entityType: string, entityId: string, fieldName: string, language: Language): string {
    return `${entityType}:${entityId}:${fieldName}:${language}`;
  }

  /**
   * Get translation from cache or database
   */
  async getTranslation(
    entityType: string,
    entityId: string,
    fieldName: string,
    language: Language
  ): Promise<string | null> {
    // Check memory cache first
    const cacheKey = this.getCacheKey(entityType, entityId, fieldName, language);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check database
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('translated_text')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('field_name', fieldName)
        .eq('language', language)
        .single();

      if (!error && data) {
        this.cache.set(cacheKey, data.translated_text);
        return data.translated_text;
      }
    } catch (error) {
      // Table might not exist yet, silently fail
      console.warn('Translation cache lookup failed:', error);
    }

    return null;
  }

  /**
   * Translate and cache a single field
   */
  async translateAndCache(request: TranslationRequest): Promise<string> {
    const { entityType, entityId, fieldName, sourceText, targetLanguage, context } = request;

    // Check if translation exists
    const existing = await this.getTranslation(entityType, entityId, fieldName, targetLanguage);
    if (existing) {
      return existing;
    }

    // If source language (Portuguese), return as-is
    if (targetLanguage === 'pt') {
      return sourceText;
    }

    // Translate using Gemini
    try {
      const translated = await geminiService.translateText(
        sourceText,
        this.getLanguageName(targetLanguage),
        context
      );

      // Save to database
      try {
        await supabase
          .from('translations')
          .upsert({
            entity_type: entityType,
            entity_id: entityId,
            field_name: fieldName,
            language: targetLanguage,
            translated_text: translated,
            updated_at: new Date().toISOString()
          });
      } catch (dbError) {
        // Database table might not exist yet, continue anyway
        console.warn('Failed to cache translation in database:', dbError);
      }

      // Cache in memory
      const cacheKey = this.getCacheKey(entityType, entityId, fieldName, targetLanguage);
      this.cache.set(cacheKey, translated);

      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return sourceText; // Fallback to original text
    }
  }

  /**
   * Translate multiple products in batch
   */
  async translateProducts(products: any[], targetLanguage: Language): Promise<any[]> {
    if (targetLanguage === 'pt') {
      return products; // No translation needed
    }

    const translatedProducts = await Promise.all(
      products.map(async (product) => {
        const [title, subtitle, description] = await Promise.all([
          this.translateAndCache({
            entityType: 'product',
            entityId: product.id,
            fieldName: 'title',
            sourceText: product.title,
            targetLanguage,
            context: 'Biblical book title'
          }),
          product.subtitle ? this.translateAndCache({
            entityType: 'product',
            entityId: product.id,
            fieldName: 'subtitle',
            sourceText: product.subtitle,
            targetLanguage,
            context: 'Biblical book subtitle'
          }) : product.subtitle,
          product.description ? this.translateAndCache({
            entityType: 'product',
            entityId: product.id,
            fieldName: 'description',
            sourceText: product.description,
            targetLanguage,
            context: 'Biblical book description'
          }) : product.description
        ]);

        return {
          ...product,
          title,
          subtitle,
          description
        };
      })
    );

    return translatedProducts;
  }

  /**
   * Translate chapters
   */
  async translateChapters(chapters: any[], targetLanguage: Language): Promise<any[]> {
    if (targetLanguage === 'pt') {
      return chapters;
    }

    const translatedChapters = await Promise.all(
      chapters.map(async (chapter) => {
        const title = await this.translateAndCache({
          entityType: 'chapter',
          entityId: chapter.id,
          fieldName: 'title',
          sourceText: chapter.title,
          targetLanguage,
          context: 'Bible chapter title'
        });

        return {
          ...chapter,
          title
        };
      })
    );

    return translatedChapters;
  }

  /**
   * Helper to convert language code to full name
   */
  private getLanguageName(code: Language): string {
    const names: Record<Language, string> = {
      pt: 'Portuguese',
      es: 'Spanish',
      en: 'English',
      fr: 'French'
    };
    return names[code];
  }

  /**
   * Clear all caches (for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const translationService = new TranslationService();

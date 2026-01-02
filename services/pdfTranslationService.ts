import { supabase } from '../lib/supabaseClient';
import { geminiService } from './geminiService';

interface TranslatedPDF {
  id: number;
  original_pdf_url: string;
  language: string;
  translated_content: string;
  storage_url: string | null;
  translation_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export class PDFTranslationService {
  private cache: Map<string, string> = new Map();

  /**
   * Get cache key for a PDF translation
   */
  private getCacheKey(pdfUrl: string, language: string): string {
    return `${pdfUrl}::${language}`;
  }

  /**
   * Fetch PDF as text from URL
   */
  private async fetchPDFText(url: string): Promise<string> {
    try {
      // For Google Drive URLs, convert to direct download link
      const directUrl = this.convertToDirectURL(url);

      const response = await fetch(directUrl);
      const blob = await response.blob();

      // Use Gemini Vision to extract text from PDF
      // Convert blob to base64
      const base64 = await this.blobToBase64(blob);

      const prompt = `Extract ALL text from this PDF document. Return ONLY the extracted text, no explanations or formatting. Preserve paragraph breaks with double newlines.`;

      // Use Gemini to extract text (works for both native PDFs and scanned)
      const extractedText = await geminiService.extractTextFromDocument(base64, prompt);

      return extractedText;
    } catch (error) {
      console.error('Error fetching PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert Google Drive share URL to direct download URL
   */
  private convertToDirectURL(url: string): string {
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return url;
  }

  /**
   * Check if translation exists in database
   */
  private async getFromDatabase(pdfUrl: string, language: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('translated_pdfs')
      .select('translated_content, translation_status')
      .eq('original_pdf_url', pdfUrl)
      .eq('language', language)
      .eq('translation_status', 'completed')
      .single();

    if (error || !data) return null;
    return data.translated_content;
  }

  /**
   * Save translation to database
   */
  private async saveToDatabase(
    pdfUrl: string,
    language: string,
    translatedContent: string
  ): Promise<void> {
    await supabase.from('translated_pdfs').upsert({
      original_pdf_url: pdfUrl,
      language,
      translated_content: translatedContent,
      translation_status: 'completed',
      created_at: new Date().toISOString()
    }, {
      onConflict: 'original_pdf_url,language'
    });
  }

  /**
   * Translate PDF text using Gemini
   */
  private async translatePDFText(text: string, targetLanguage: string): Promise<string> {
    const languageNames: Record<string, string> = {
      pt: 'Portuguese',
      es: 'Spanish',
      en: 'English',
      fr: 'French'
    };

    const prompt = `Translate the following PDF content to ${languageNames[targetLanguage] || targetLanguage}.

IMPORTANT RULES:
1. Maintain the original formatting and structure
2. Preserve paragraph breaks and sections
3. Use appropriate biblical and theological terminology
4. Keep names of people and places in their original form
5. Return ONLY the translated text, no explanations

Content to translate:
${text}`;

    return await geminiService.translateText(text, languageNames[targetLanguage], 'Biblical/Educational PDF content');
  }

  /**
   * Main method: Get translated PDF content
   * Returns HTML content with the translated text
   */
  async getTranslatedPDF(pdfUrl: string, language: string, title: string): Promise<string> {
    // If Portuguese (original), return original PDF URL
    if (language === 'pt') {
      return pdfUrl;
    }

    const cacheKey = this.getCacheKey(pdfUrl, language);

    // 1. Check memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 2. Check database cache
    const cachedTranslation = await this.getFromDatabase(pdfUrl, language);
    if (cachedTranslation) {
      this.cache.set(cacheKey, cachedTranslation);
      return cachedTranslation;
    }

    // 3. Extract, translate, and cache
    try {
      // Extract text from PDF
      const originalText = await this.fetchPDFText(pdfUrl);

      // Translate text
      const translatedText = await this.translatePDFText(originalText, language);

      // Create HTML version for display
      const htmlContent = this.createHTMLFromText(translatedText, title, language);

      // Save to database
      await this.saveToDatabase(pdfUrl, language, htmlContent);

      // Save to memory cache
      this.cache.set(cacheKey, htmlContent);

      return htmlContent;
    } catch (error) {
      console.error('Error translating PDF:', error);
      throw error;
    }
  }

  /**
   * Create HTML document from translated text
   */
  private createHTMLFromText(text: string, title: string, language: string): string {
    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fafaf9;
      color: #27272a;
    }
    h1 {
      font-size: 2em;
      color: #18181b;
      margin-bottom: 30px;
      border-bottom: 2px solid #a855f7;
      padding-bottom: 10px;
    }
    p {
      margin-bottom: 1.2em;
      text-align: justify;
    }
    .watermark {
      text-align: center;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #d4d4d8;
      color: #71717a;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${text.split('\n\n').map(para => para.trim() ? `<p>${para}</p>` : '').join('\n')}

  <div class="watermark">
    Traduzido automaticamente via IA • Projeto As Cartas de Paulo
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const pdfTranslationService = new PDFTranslationService();

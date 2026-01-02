import { supabase } from '../lib/supabaseClient';
import { geminiService } from './geminiService';

const BUCKET_NAME = 'pdfs';
const ORIGINALS_PATH = 'originals';
const TRANSLATED_PATH = 'translated';

export class PDFStorageService {
  /**
   * Upload PDF to Supabase Storage
   */
  async uploadPDF(file: File, productId: string): Promise<string> {
    const fileName = `${ORIGINALS_PATH}/${productId}.pdf`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading PDF:', error);
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Get PDF URL from storage
   */
  getPDFUrl(productId: string, language: string = 'pt'): string {
    let fileName: string;

    if (language === 'pt') {
      fileName = `${ORIGINALS_PATH}/${productId}.pdf`;
    } else {
      fileName = `${TRANSLATED_PATH}/${productId}-${language}.pdf`;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Check if translated PDF exists
   */
  async translatedPDFExists(productId: string, language: string): Promise<boolean> {
    const fileName = `${TRANSLATED_PATH}/${productId}-${language}.pdf`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(TRANSLATED_PATH, {
        search: `${productId}-${language}.pdf`
      });

    return !error && data && data.length > 0;
  }

  /**
   * Download PDF as blob
   */
  async downloadPDF(productId: string): Promise<Blob> {
    const fileName = `${ORIGINALS_PATH}/${productId}.pdf`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(fileName);

    if (error || !data) {
      throw new Error(`Failed to download PDF: ${error?.message}`);
    }

    return data;
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
   * Extract text from PDF using Gemini
   */
  async extractTextFromPDF(blob: Blob): Promise<string> {
    const base64 = await this.blobToBase64(blob);

    const prompt = `Extract ALL text from this PDF document.

IMPORTANT:
- Return ONLY the extracted text
- Preserve paragraph structure with double newlines
- Keep headings and section titles
- Maintain logical reading order
- Do not add explanations or formatting

Extract the text now:`;

    const extractedText = await geminiService.extractTextFromDocument(base64, prompt);
    return extractedText;
  }

  /**
   * Translate PDF text
   */
  async translateText(text: string, targetLanguage: string): Promise<string> {
    const languageNames: Record<string, string> = {
      es: 'Spanish',
      en: 'English',
      fr: 'French'
    };

    const prompt = `Translate the following biblical text to ${languageNames[targetLanguage]}.

IMPORTANT RULES:
1. Maintain biblical terminology accuracy
2. Preserve paragraph structure
3. Keep verse numbers and references as-is
4. Use appropriate religious language
5. Return ONLY the translated text, no explanations

Text to translate:
${text}`;

    return await geminiService.translateText(text, languageNames[targetLanguage], 'Biblical/Educational content');
  }

  /**
   * Generate HTML from translated text
   */
  private generateHTML(text: string, title: string, language: string): string {
    return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
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
      font-size: 2.5em;
      color: #18181b;
      margin-bottom: 30px;
      border-bottom: 3px solid #a855f7;
      padding-bottom: 15px;
      text-align: center;
    }
    p {
      margin-bottom: 1.2em;
      text-align: justify;
      text-indent: 1.5em;
    }
    p:first-of-type { text-indent: 0; }
    .chapter {
      font-size: 1.2em;
      font-weight: bold;
      margin-top: 2em;
      margin-bottom: 1em;
      color: #a855f7;
    }
    .watermark {
      text-align: center;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #d4d4d8;
      color: #71717a;
      font-size: 0.85em;
      font-style: italic;
    }
    @media print {
      body { background: white; }
      .watermark { page-break-before: always; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${text.split('\n\n').map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    // Check if it's a chapter heading
    if (trimmed.match(/^(Chapter|Capítulo|Chapitre|Capítulo)\s+\d+/i)) {
      return `<p class="chapter">${trimmed}</p>`;
    }
    return `<p>${trimmed}</p>`;
  }).filter(p => p).join('\n')}

  <div class="watermark">
    Traduzido automaticamente via IA • Projeto As Cartas de Paulo
  </div>
</body>
</html>`;
  }

  /**
   * Translate PDF and save to storage
   */
  async translatePDF(
    productId: string,
    productTitle: string,
    targetLanguage: string,
    onProgress?: (stage: string) => void
  ): Promise<string> {
    try {
      // 1. Check if already exists
      const exists = await this.translatedPDFExists(productId, targetLanguage);
      if (exists) {
        return this.getPDFUrl(productId, targetLanguage);
      }

      // 2. Download original PDF
      onProgress?.('Baixando PDF original...');
      const pdfBlob = await this.downloadPDF(productId);

      // 3. Extract text
      onProgress?.('Extraindo texto do PDF...');
      const extractedText = await this.extractTextFromPDF(pdfBlob);

      // 4. Translate text
      onProgress?.('Traduzindo conteúdo...');
      const translatedText = await this.translateText(extractedText, targetLanguage);

      // 5. Generate HTML
      onProgress?.('Gerando documento traduzido...');
      const html = this.generateHTML(translatedText, productTitle, targetLanguage);

      // 6. Upload as HTML (can be viewed in iframe)
      const fileName = `${TRANSLATED_PATH}/${productId}-${targetLanguage}.html`;
      const htmlBlob = new Blob([html], { type: 'text/html' });

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, htmlBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw new Error(`Failed to upload translated PDF: ${error.message}`);
      }

      // 7. Save metadata to database
      await supabase.from('translated_pdfs').upsert({
        original_pdf_url: this.getPDFUrl(productId, 'pt'),
        language: targetLanguage,
        translated_content: html,
        storage_path: fileName,
        translation_status: 'completed'
      }, {
        onConflict: 'original_pdf_url,language'
      });

      // 8. Return public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error translating PDF:', error);
      throw error;
    }
  }

  /**
   * Get translated PDF URL (translates if needed)
   */
  async getTranslatedPDF(
    productId: string,
    productTitle: string,
    language: string,
    onProgress?: (stage: string) => void
  ): Promise<string> {
    if (language === 'pt') {
      return this.getPDFUrl(productId, 'pt');
    }

    // Check if translation exists
    const exists = await this.translatedPDFExists(productId, language);

    if (exists) {
      // Return translated version
      const fileName = `${TRANSLATED_PATH}/${productId}-${language}.html`;
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      return publicUrl;
    }

    // Translate on-demand
    return await this.translatePDF(productId, productTitle, language, onProgress);
  }
}

export const pdfStorageService = new PDFStorageService();

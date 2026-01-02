import { GoogleGenAI } from "@google/genai";

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not configured');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generate image using Gemini Flash Image model
   */
  async generateImage(prompt: string, aspectRatio: "3:4" | "16:9" = "3:4"): Promise<File | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio
          }
        }
      });

      let base64String = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64String = part.inlineData.data;
          break;
        }
      }

      if (base64String) {
        const res = await fetch(`data:image/png;base64,${base64String}`);
        const blob = await res.blob();
        return new File([blob], `ai_generated_${Date.now()}.png`, { type: "image/png" });
      }

      return null;
    } catch (error) {
      console.error('Gemini Image Generation Error:', error);
      throw error;
    }
  }

  /**
   * Translate text using Gemini Pro
   */
  async translateText(
    text: string,
    targetLanguage: string,
    context?: string
  ): Promise<string> {
    try {
      const prompt = `Translate the following text to ${targetLanguage}.
${context ? `Context: ${context}` : ''}

Rules:
- Maintain the original tone and meaning
- Keep special characters and formatting
- If it's a religious text, use appropriate terminology
- Return ONLY the translation, no explanations

Text to translate:
${text}`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
          parts: [{ text: prompt }]
        }
      });

      const translatedText = response.candidates?.[0]?.content?.parts?.[0]?.text || text;
      return translatedText.trim();
    } catch (error) {
      console.error('Gemini Translation Error:', error);
      throw error;
    }
  }

  /**
   * Translate multiple texts in batch (more efficient)
   */
  async translateBatch(
    texts: Array<{ key: string; text: string }>,
    targetLanguage: string
  ): Promise<Record<string, string>> {
    try {
      const textList = texts.map((item, idx) => `[${idx}] ${item.text}`).join('\n');

      const prompt = `Translate each numbered item to ${targetLanguage}. Return in this exact format:
[0] translated text here
[1] translated text here

Items to translate:
${textList}`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
          parts: [{ text: prompt }]
        }
      });

      const result = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse the response
      const translations: Record<string, string> = {};
      const lines = result.split('\n');

      texts.forEach((item, idx) => {
        const line = lines.find(l => l.trim().startsWith(`[${idx}]`));
        if (line) {
          const translated = line.replace(`[${idx}]`, '').trim();
          translations[item.key] = translated;
        } else {
          translations[item.key] = item.text; // Fallback to original
        }
      });

      return translations;
    } catch (error) {
      console.error('Gemini Batch Translation Error:', error);
      throw error;
    }
  }

  /**
   * Extract text from a document (PDF) using Gemini Vision
   */
  async extractTextFromDocument(base64Data: string, prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data
              }
            }
          ]
        }
      });

      const extractedText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return extractedText.trim();
    } catch (error) {
      console.error('Gemini Document Extraction Error:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();

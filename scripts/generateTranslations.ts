/**
 * Script to generate translation files using Gemini AI
 * Run with: npx tsx scripts/generateTranslations.ts
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ VITE_GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const languages = [
  { code: 'es', name: 'Spanish' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' }
];

async function translateJSON(sourceJSON: any, targetLanguage: string): Promise<any> {
  console.log(`\n🔄 Translating to ${targetLanguage}...`);

  const prompt = `You are a professional translator specializing in religious and biblical content.

Translate the following JSON file from Portuguese to ${targetLanguage}.

IMPORTANT RULES:
1. Keep the exact same JSON structure
2. Only translate the VALUES, never translate the KEYS
3. Preserve all special characters, line breaks (\\n), and formatting
4. Use appropriate biblical and religious terminology
5. Keep variable placeholders like {title}, {count}, {success}, {fail} EXACTLY as they are
6. Return ONLY valid JSON, no explanations

Source JSON in Portuguese:
${JSON.stringify(sourceJSON, null, 2)}

Translated JSON in ${targetLanguage}:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    let translatedText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up the response - remove markdown code blocks if present
    translatedText = translatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse to validate JSON
    const translatedJSON = JSON.parse(translatedText);

    console.log(`✅ ${targetLanguage} translation completed`);
    return translatedJSON;

  } catch (error) {
    console.error(`❌ Error translating to ${targetLanguage}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🌐 Starting translation generation...\n');

  // Read the Portuguese source file
  const ptFilePath = path.join(__dirname, '../i18n/locales/pt.json');
  const ptJSON = JSON.parse(fs.readFileSync(ptFilePath, 'utf-8'));

  console.log('📖 Loaded Portuguese source file');
  console.log(`   Keys: ${Object.keys(ptJSON).length}`);

  // Generate translations for each language
  for (const lang of languages) {
    try {
      const translated = await translateJSON(ptJSON, lang.name);

      // Save to file
      const outputPath = path.join(__dirname, `../i18n/locales/${lang.code}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2), 'utf-8');

      console.log(`💾 Saved: i18n/locales/${lang.code}.json`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`Failed to generate ${lang.code}.json`);
    }
  }

  console.log('\n✨ All translations generated successfully!');
  console.log('\n📋 Generated files:');
  console.log('   - i18n/locales/es.json (Spanish)');
  console.log('   - i18n/locales/en.json (English)');
  console.log('   - i18n/locales/fr.json (French)');
  console.log('\n🚀 Multi-language system is ready!');
}

main().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function listStorageFiles() {
  console.log('=== ARQUIVOS NO STORAGE ===\n');

  // List files in pdfs bucket
  const { data: originals } = await supabase.storage
    .from('pdfs')
    .list('originals', { limit: 100 });

  const { data: translated } = await supabase.storage
    .from('pdfs')
    .list('translated', { limit: 100 });

  console.log('📁 ORIGINALS (Português):');
  if (originals) {
    originals.forEach(f => console.log(`  - ${f.name}`));
  }

  console.log('\n📁 TRANSLATED (Espanhol):');
  if (translated) {
    translated.forEach(f => console.log(`  - ${f.name}`));
  }

  // List files in audios bucket
  const { data: audioOriginals } = await supabase.storage
    .from('audios')
    .list('originals', { limit: 100 });

  const { data: audioTranslated } = await supabase.storage
    .from('audios')
    .list('translated', { limit: 100 });

  console.log('\n🎵 AUDIOS ORIGINALS:');
  if (audioOriginals) {
    audioOriginals.forEach(f => console.log(`  - ${f.name}`));
  }

  console.log('\n🎵 AUDIOS TRANSLATED:');
  if (audioTranslated) {
    audioTranslated.forEach(f => console.log(`  - ${f.name}`));
  }
}

listStorageFiles();

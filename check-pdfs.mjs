import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function checkPDFs() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, category, pdf_url, audio_url')
    .order('id');

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log('=== VERIFICANDO PDFs E ÁUDIOS ===\n');

  const letters = data.filter(p => p.category === 'LETTER');
  const bonuses = data.filter(p => p.category === 'BONUS');

  console.log('📚 LETTERS:');
  letters.forEach(p => {
    const hasPdf = p.pdf_url && p.pdf_url !== '#';
    const hasAudio = p.audio_url && p.audio_url !== '#';
    console.log(`  ${hasPdf ? '✅' : '❌'} PDF | ${hasAudio ? '✅' : '❌'} Audio | ${p.title}`);
    if (hasPdf) console.log(`     📄 ${p.pdf_url.substring(0, 80)}...`);
  });

  console.log('\n🎁 BONUS:');
  bonuses.forEach(p => {
    const hasPdf = p.pdf_url && p.pdf_url !== '#';
    const hasAudio = p.audio_url && p.audio_url !== '#';
    console.log(`  ${hasPdf ? '✅' : '❌'} PDF | ${hasAudio ? '✅' : '❌'} Audio | ${p.title}`);
    if (hasPdf) console.log(`     📄 ${p.pdf_url.substring(0, 80)}...`);
  });

  // Check storage buckets
  console.log('\n=== VERIFICANDO BUCKETS DE STORAGE ===\n');
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets) {
    buckets.forEach(bucket => {
      console.log(`📦 ${bucket.name} - ${bucket.public ? '🌍 Público' : '🔒 Privado'}`);
    });
  }
}

checkPDFs();

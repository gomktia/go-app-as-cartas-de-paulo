import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function testQuery() {
  console.log('🔍 Testando query exatamente como o app faz...\n');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.log('❌ ERRO:', error.message);
    return;
  }

  console.log(`Total de produtos: ${data.length}\n`);

  const bonuses = data.filter(p => p.category === 'BONUS');
  console.log(`📦 BONUS encontrados: ${bonuses.length}\n`);

  bonuses.forEach(b => {
    console.log(`✅ ${b.title}`);
    console.log(`   ID: ${b.id}`);
    console.log(`   pdf_url: ${b.pdf_url || 'VAZIO!'}`);
    console.log(`   Válido? ${b.pdf_url && b.pdf_url !== '#' ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log('');
  });

  // Simular o que o app faz
  console.log('\n🔄 SIMULANDO O QUE O APP FAZ:\n');
  const mappedBonuses = bonuses.map(item => ({
    id: item.id?.toString() || item.product_id,
    title: item.title,
    pdfUrl: item.pdf_url,  // Esta é a conversão que o app faz!
    audioUrl: item.audio_url
  }));

  mappedBonuses.forEach(b => {
    const hasValidPdf = b.pdfUrl && b.pdfUrl !== '#';
    console.log(`${hasValidPdf ? '✅' : '❌'} ${b.title}`);
    console.log(`   pdfUrl: ${b.pdfUrl || 'VAZIO'}`);
    console.log('');
  });
}

testQuery();

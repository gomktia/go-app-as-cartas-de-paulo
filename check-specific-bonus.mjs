import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function checkSpecificBonus() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('title', 'Pablo en el Día a Día');

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Produto não encontrado: Pablo en el Día a Día');
    return;
  }

  const product = data[0];
  console.log('\n=== PABLO EN EL DÍA A DÍA ===\n');
  console.log('ID:', product.id);
  console.log('Title:', product.title);
  console.log('Subtitle:', product.subtitle);
  console.log('Category:', product.category);
  console.log('PDF URL:', product.pdf_url);
  console.log('Audio URL:', product.audio_url);
  console.log('\nPDF válido?', product.pdf_url && product.pdf_url !== '#' ? '✅ SIM' : '❌ NÃO');
}

checkSpecificBonus();

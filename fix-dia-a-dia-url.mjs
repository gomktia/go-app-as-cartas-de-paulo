import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function fixDiaADia() {
  const correctUrl = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs/translated/bonus-diaadia-es.pdf';

  const { data, error } = await supabase
    .from('products')
    .update({ pdf_url: correctUrl })
    .eq('title', 'Pablo en el Día a Día')
    .select();

  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('✅ URL corrigido para "Pablo en el Día a Día"!');
    console.log('   Novo URL:', correctUrl);
  }
}

fixDiaADia();

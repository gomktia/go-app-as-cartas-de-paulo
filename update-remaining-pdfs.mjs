import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const STORAGE_BASE = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs';

async function updateRemainingPDFs() {
  console.log('🔄 Atualizando PDFs restantes...\n');

  // CORÍNTIOS (with trailing space)
  let pdfUrl = `${STORAGE_BASE}/translated/letter-1corintios-es.pdf`;
  let { error } = await supabase
    .from('products')
    .update({ pdf_url: pdfUrl })
    .eq('title', 'CORÍNTIOS ')
    .select();
  console.log(error ? `❌ CORÍNTIOS: ${error.message}` : '✅ CORÍNTIOS → letter-1corintios-es.pdf');

  // COLOSSENSES (with trailing space)
  pdfUrl = `${STORAGE_BASE}/translated/letter-colossenses-es.pdf`;
  ({ error } = await supabase
    .from('products')
    .update({ pdf_url: pdfUrl })
    .eq('title', 'COLOSSENSES ')
    .select());
  console.log(error ? `❌ COLOSSENSES: ${error.message}` : '✅ COLOSSENSES → letter-colossenses-es.pdf');

  // COMO TER UMA VIDA DE ORAÇÃO (with trailing space)
  pdfUrl = `${STORAGE_BASE}/translated/premium-culpa-es.pdf`;
  ({ error } = await supabase
    .from('products')
    .update({ pdf_url: pdfUrl })
    .eq('title', 'COMO TER UMA VIDA DE ORAÇÃO ')
    .select());
  console.log(error ? `❌ ORAÇÃO: ${error.message}` : '✅ ORAÇÃO → premium-culpa-es.pdf');

  console.log('\n✅ Concluído!');
}

updateRemainingPDFs();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const STORAGE_BASE = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs';

// Mapping of product titles to Spanish PDF filenames
const pdfMappings = [
  // LETTERS
  { title: 'EFÉSIOS', file: 'letter-efesios-es.pdf' },
  { title: 'GÁLATAS', file: 'letter-galatas-es.pdf' },
  { title: 'CORÍNTIOS', file: 'letter-1corintios-es.pdf' }, // Assuming 1 Corinthians
  { title: 'COLOSSENSES', file: 'letter-colossenses-es.pdf' },
  { title: 'FILEMOM', file: 'letter-filemon-es.pdf' },
  { title: 'FILIPENSES', file: 'letter-filipenses-es.pdf' },
  { title: 'TESSALONICENSES', file: 'letter-1tessalonicenses-es.pdf' },
  { title: 'TIMOTEO', file: 'letter-1timoteo-es.pdf' },
  { title: 'TITO', file: 'letter-tito-es.pdf' },

  // BONUS
  { title: 'A IMPORTÂNCIA DE TEMER A DEUS', file: 'premium-ansiedad-es.pdf' },
  { title: 'COMO TER UMA VIDA DE ORAÇÃO', file: 'premium-culpa-es.pdf' },
  { title: 'COMO TER UMA VIDA DE SANTIDADE', file: 'premium-diadia-es.pdf' },
  { title: 'COMO TER INTÍMIDADE COM DEUS', file: 'premium-matrimonio-es.pdf' },
  { title: 'VENCENDO BATALHAS ESPIRITUAIS', file: 'premium-mapa-biblia-es.pdf' }
];

async function updateSpanishPDFs() {
  console.log('🔄 Atualizando URLs dos PDFs para espanhol...\n');

  for (const mapping of pdfMappings) {
    const pdfUrl = `${STORAGE_BASE}/translated/${mapping.file}`;

    const { data, error } = await supabase
      .from('products')
      .update({ pdf_url: pdfUrl })
      .eq('title', mapping.title)
      .select();

    if (error) {
      console.log(`❌ ${mapping.title}: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ ${mapping.title} → ${mapping.file}`);
    } else {
      console.log(`⚠️  ${mapping.title}: Produto não encontrado`);
    }
  }

  console.log('\n✅ Atualização completa!');
}

updateSpanishPDFs();

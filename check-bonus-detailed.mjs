import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function checkBonusDetailed() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', 'BONUS')
    .order('id');

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log('\n=== PRODUTOS BONUS ===\n');

  data.forEach(p => {
    const hasPdf = p.pdf_url && p.pdf_url !== '#' && p.pdf_url !== null;
    console.log(`${hasPdf ? '✅' : '❌'} ${p.title}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   PDF: ${p.pdf_url || 'NÃO CADASTRADO'}`);
    console.log('');
  });

  console.log(`\nTotal: ${data.length} bônus`);
  const withPdf = data.filter(p => p.pdf_url && p.pdf_url !== '#').length;
  console.log(`Com PDF: ${withPdf}/${data.length}`);
}

checkBonusDetailed();

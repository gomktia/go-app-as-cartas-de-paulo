import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function checkChapters() {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .order('product_id')
    .order('order_index');

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log(`\n=== TOTAL: ${data.length} capítulos cadastrados ===\n`);

  // Group by product_id
  const byProduct = {};
  data.forEach(ch => {
    if (!byProduct[ch.product_id]) byProduct[ch.product_id] = [];
    byProduct[ch.product_id].push(ch);
  });

  for (const [productId, chapters] of Object.entries(byProduct)) {
    console.log(`📚 Product ID ${productId}: ${chapters.length} capítulos`);
    chapters.forEach(ch => {
      console.log(`   ${ch.order_index}. ${ch.title} (${ch.language})`);
    });
    console.log('');
  }
}

checkChapters();

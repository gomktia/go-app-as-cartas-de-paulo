import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function findCorintios() {
  // Get product
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .ilike('title', '%CORÍNTIOS%');

  console.log('📚 Produtos encontrados:\n');
  products?.forEach(p => {
    console.log(`ID: ${p.id}`);
    console.log(`Title: ${p.title}`);
    console.log(`Category: ${p.category}`);
    console.log('');
  });

  if (products && products.length > 0) {
    const productId = products[0].id;

    // Check chapters for this product
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('product_id', productId);

    console.log(`\n📖 Capítulos para produto ID ${productId}: ${chapters?.length || 0}`);
    chapters?.forEach(ch => {
      console.log(`  - ${ch.title} (${ch.language})`);
    });
  }
}

findCorintios();

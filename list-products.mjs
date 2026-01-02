import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', 'LETTER')
    .order('id');

  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('📦 Produtos encontrados:\n');
    data.forEach(p => {
      console.log(`ID: ${p.id} | ${p.title}`);
    });
  }
}

listProducts();

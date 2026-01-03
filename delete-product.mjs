import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const id = process.argv[2];

if (!id) {
  console.error('❌ Usage: node delete-product.mjs <ID>');
  process.exit(1);
}

async function deleteProduct() {
  console.log(`Deletando produto ID ${id}...`);

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.log('Erro:', error.message);
  } else {
    console.log('Produto deletado com sucesso!');
  }
}

deleteProduct();

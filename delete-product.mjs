import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function deleteProduct() {
  console.log('Deletando produto ID 31 (Configuração de Checkout)...\n');
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', 31);

  if (error) {
    console.log('Erro:', error.message);
  } else {
    console.log('Produto deletado com sucesso!');
  }
}

deleteProduct();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function checkPremiumProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tier', 'PREMIUM');

  if (error) {
    console.log('❌ Erro:', error.message);
  } else if (data.length === 0) {
    console.log('✅ PERFEITO! Não existem mais produtos com tier PREMIUM no banco!\n');
    console.log('Todos os produtos estão liberados (BASIC) ou são upsells para venda.\n');
  } else {
    console.log(`⚠️  ATENÇÃO! Ainda existem ${data.length} produtos com tier PREMIUM:\n`);
    data.forEach(p => {
      console.log(`  - ${p.title} (categoria: ${p.category}, is_upsell: ${p.is_upsell})`);
    });
  }
}

checkPremiumProducts();

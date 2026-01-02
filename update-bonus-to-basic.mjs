import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function updateBonusToBasic() {
  console.log('🔄 Atualizando produtos BONUS de PREMIUM para BASIC...\n');

  // Update all BONUS products to BASIC tier
  const { data, error } = await supabase
    .from('products')
    .update({ tier: 'BASIC' })
    .eq('category', 'BONUS')
    .select();

  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log(`✅ ${data.length} produtos BONUS atualizados para BASIC!\n`);
    data.forEach(p => {
      console.log(`  ✓ ${p.title} - agora é BASIC`);
    });
  }
}

updateBonusToBasic();

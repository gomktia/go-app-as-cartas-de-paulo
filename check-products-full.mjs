import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function checkProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id');

  if (error) {
    console.log('Erro:', error.message);
  } else {
    console.log('=== PRODUTOS POR CATEGORIA ===\n');

    const letters = data.filter(p => p.category === 'LETTER');
    const bonuses = data.filter(p => p.category === 'BONUS');
    const upsells = data.filter(p => p.category === 'UPSELL');
    const others = data.filter(p => !['LETTER', 'BONUS', 'UPSELL'].includes(p.category));

    console.log('📚 LETTERS:', letters.length);
    letters.forEach(p => console.log(`  - ${p.title} (tier: ${p.tier}, is_upsell: ${p.is_upsell})`));

    console.log('\n🎁 BONUS:', bonuses.length);
    bonuses.forEach(p => console.log(`  - ${p.title} (tier: ${p.tier}, is_upsell: ${p.is_upsell})`));

    console.log('\n💰 UPSELLS:', upsells.length);
    upsells.forEach(p => console.log(`  - ${p.title} (tier: ${p.tier}, is_upsell: ${p.is_upsell}, price: R$ ${p.price})`));

    if (others.length > 0) {
      console.log('\n📦 OUTROS:', others.length);
      others.forEach(p => console.log(`  - ${p.title} (category: ${p.category})`));
    }
  }
}

checkProducts();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function listBuckets() {
  console.log('🔍 Listando buckets no projeto...\n');
  console.log('URL:', process.env.VITE_SUPABASE_URL);
  
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('📦 Buckets encontrados:', data.length);
    data.forEach(bucket => {
      console.log('  - Nome:', bucket.name);
      console.log('    ID:', bucket.id);
      console.log('    Público:', bucket.public);
      console.log('');
    });
  }
}

listBuckets();

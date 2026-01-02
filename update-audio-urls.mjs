import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const AUDIO_BASE = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/audios/translated';

const audioMappings = [
  { title: 'ROMANOS', audioFile: 'letter-romanos-es.m4a' },
  { title: 'CORÍNTIOS', audioFile: 'letter-corintios-es.m4a' },
  { title: 'GÁLATAS', audioFile: 'letter-galatas-es.m4a' },
  { title: 'EFÉSIOS', audioFile: 'letter-efesios-es.m4a' },
  { title: 'FILIPENSES', audioFile: 'letter-filipenses-es.m4a' },
  { title: 'COLOSSENSES', audioFile: 'letter-colossenses-es.m4a' },
  { title: 'TESSALONICENSES', audioFile: 'letter-tessalonicenses-es.m4a' },
  { title: 'TIMOTEO', audioFile: 'letter-timoteo-es.m4a' },
  { title: 'TITO', audioFile: 'letter-tito-es.m4a' },
  { title: 'FILEMOM', audioFile: 'letter-filemon-es.m4a' }
];

async function updateAudioUrls() {
  console.log('🎵 Atualizando URLs de áudio no banco de dados...\n');

  let updated = 0;
  let failed = 0;

  for (const mapping of audioMappings) {
    const audioUrl = `${AUDIO_BASE}/${mapping.audioFile}`;
    
    console.log(`📝 ${mapping.title}`);
    console.log(`   → ${audioUrl}`);

    const { data, error } = await supabase
      .from('products')
      .update({ audio_url: audioUrl })
      .eq('title', mapping.title)
      .eq('category', 'LETTER');

    if (error) {
      console.log(`   ❌ ERRO: ${error.message}\n`);
      failed++;
    } else {
      console.log(`   ✅ Atualizado!\n`);
      updated++;
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO:');
  console.log(`   ✅ Atualizados: ${updated}`);
  console.log(`   ❌ Falhas: ${failed}`);
  console.log(`   📁 Total: ${audioMappings.length}`);
  console.log('='.repeat(60));
}

updateAudioUrls();

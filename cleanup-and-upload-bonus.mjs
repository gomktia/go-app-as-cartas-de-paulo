import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const BONUS_FOLDER = '/Users/pantera/Downloads/Bonus_espanhol';
const BUCKET = 'pdfs';
const STORAGE_FOLDER = 'translated';
const STORAGE_BASE = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs/translated';

const bonusFiles = [
  {
    file: 'Pablo-y-la-Ansiedad.pdf',
    storageName: 'bonus-ansiedad-es.pdf',
    title: 'Pablo y la Ansiedad',
    subtitle: 'PAZ EN MEDIO DE LA TORMENTA'
  },
  {
    file: 'PABLO-Y-LA-CULPA-RELIGIOSA.pdf',
    storageName: 'bonus-culpa-es.pdf',
    title: 'Pablo y la Culpa Religiosa',
    subtitle: 'LIBERTAD DE LA CULPA'
  },
  {
    file: 'PABLO-Y-EL-MATRIMONIO.pdf',
    storageName: 'bonus-matrimonio-es.pdf',
    title: 'Pablo y el Matrimonio',
    subtitle: 'ENSEÑANZAS SOBRE EL MATRIMONIO'
  },
  {
    file: 'Pablo-en-el-dia-a-dia.pdf',
    storageName: 'bonus-diaadia-es.pdf',
    title: 'Pablo en el Día a Día',
    subtitle: 'VIDA CRISTIANA PRÁCTICA'
  }
];

async function cleanupAndUpload() {
  console.log('🗑️  PASSO 1: Removendo arquivos antigos do storage...\n');

  // Delete old premium-* files
  const oldFiles = [
    'premium-ansiedad-es.pdf',
    'premium-culpa-es.pdf',
    'premium-diadia-es.pdf',
    'premium-matrimonio-es.pdf',
    'premium-mapa-biblia-es.pdf'
  ];

  for (const file of oldFiles) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([`${STORAGE_FOLDER}/${file}`]);

    if (error) {
      console.log(`   ⚠️  ${file}: ${error.message}`);
    } else {
      console.log(`   ✅ Removido: ${file}`);
    }
  }

  console.log('\n📤 PASSO 2: Uploading novos PDFs em espanhol...\n');

  for (const { file, storageName } of bonusFiles) {
    try {
      const filePath = `${BONUS_FOLDER}/${file}`;
      const fileBuffer = readFileSync(filePath);
      const storagePath = `${STORAGE_FOLDER}/${storageName}`;

      console.log(`⏳ Uploading ${file}...`);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      } else {
        console.log(`   ✅ Upload completo: ${storageName}`);
      }
    } catch (err) {
      console.log(`   ❌ Erro ao ler arquivo: ${err.message}`);
    }
  }

  console.log('\n🔄 PASSO 3: Atualizando banco de dados...\n');

  // Get all current BONUS products
  const { data: currentBonuses } = await supabase
    .from('products')
    .select('id, title')
    .eq('category', 'BONUS');

  console.log(`Encontrados ${currentBonuses?.length || 0} produtos BONUS no banco`);

  // Delete all current bonus products
  if (currentBonuses && currentBonuses.length > 0) {
    for (const bonus of currentBonuses) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', bonus.id);

      if (!error) {
        console.log(`   🗑️  Deletado: ${bonus.title}`);
      }
    }
  }

  console.log('\n✨ PASSO 4: Criando novos produtos BONUS...\n');

  // Insert new bonus products
  for (const { storageName, title, subtitle } of bonusFiles) {
    const pdfUrl = `${STORAGE_BASE}/${storageName}`;

    const { error } = await supabase
      .from('products')
      .insert({
        title: title,
        subtitle: subtitle,
        category: 'BONUS',
        tier: 'BASIC',
        is_upsell: false,
        pdf_url: pdfUrl,
        audio_url: null,
        price: 0,
        description: '',
        image_url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070'
      });

    if (error) {
      console.log(`   ❌ ${title}: ${error.message}`);
    } else {
      console.log(`   ✅ Criado: ${title}`);
    }
  }

  console.log('\n🎉 LIMPEZA E ATUALIZAÇÃO COMPLETA!');
}

cleanupAndUpload();

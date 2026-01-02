import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const BONUS_FOLDER = '/Users/pantera/Downloads/bonus';
const BUCKET = 'pdfs';
const STORAGE_FOLDER = 'translated';

const bonusFiles = [
  { file: 'PABLO-Y-EL-MATRIMONIO.pdf', newName: 'bonus-matrimonio-es.pdf' },
  { file: 'PABLO-Y-LA-CULPA-RELIGIOSA.pdf', newName: 'bonus-culpa-es.pdf' },
  { file: 'Pablo-en-el-dia-a-dia.pdf', newName: 'bonus-diaadia-es.pdf' },
  { file: 'Pablo-y-la-Ansiedad.pdf', newName: 'bonus-ansiedad-es.pdf' }
];

async function uploadBonusPDFs() {
  console.log('📤 Fazendo upload dos PDFs de bônus...\n');

  for (const { file, newName } of bonusFiles) {
    try {
      const filePath = `${BONUS_FOLDER}/${file}`;
      const fileBuffer = readFileSync(filePath);
      const storagePath = `${STORAGE_FOLDER}/${newName}`;

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
        console.log(`   ✅ Upload completo: ${newName}`);
      }
    } catch (err) {
      console.log(`   ❌ Erro ao ler arquivo: ${err.message}`);
    }
  }

  console.log('\n✅ Upload de todos os bônus concluído!');
}

uploadBonusPDFs();

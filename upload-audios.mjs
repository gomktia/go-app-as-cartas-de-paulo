#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const BUCKET = 'pdfs';
const UPLOAD_DIR = './audios-to-upload';

async function uploadAudios() {
  console.log('🎵 Iniciando upload de áudios...\n');

  try {
    const files = await readdir(UPLOAD_DIR);
    const audioFiles = files.filter(f => f.endsWith('.m4a'));

    if (audioFiles.length === 0) {
      console.log('⚠️  Nenhum áudio encontrado');
      return;
    }

    console.log(`📁 Encontrados ${audioFiles.length} áudios:\n`);

    let uploaded = 0;
    let failed = 0;

    for (const filename of audioFiles) {
      try {
        const match = filename.match(/^(.+?)(?:-(es|en|fr))?\.m4a$/);
        if (!match) {
          console.log(`⚠️  Nome inválido: ${filename}`);
          continue;
        }

        const productId = match[1];
        const language = match[2] || 'pt';
        const folder = language === 'pt' ? 'audios/originals' : 'audios/translated';
        const storagePath = `${folder}/${filename}`;

        console.log(`📤 Uploading ${filename}...`);
        console.log(`   → ${storagePath}`);

        const filePath = join(UPLOAD_DIR, filename);
        const fileBuffer = await readFile(filePath);
        const blob = new Blob([fileBuffer], { type: 'audio/m4a' });

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'audio/m4a'
          });

        if (error) {
          console.log(`   ❌ ERRO: ${error.message}\n`);
          failed++;
        } else {
          const publicUrl = `https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs/${storagePath}`;
          console.log(`   ✅ Sucesso!`);
          console.log(`   🔗 ${publicUrl}\n`);
          uploaded++;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}\n`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total: ${audioFiles.length}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

uploadAudios();

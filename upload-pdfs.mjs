#!/usr/bin/env node
/**
 * Script Automático de Upload de PDFs
 *
 * Uso:
 * 1. Coloque seus PDFs na pasta pdfs-to-upload/
 * 2. Nomeie os arquivos: {product-id}.pdf ou {product-id}-{lang}.pdf
 * 3. Execute: node upload-pdfs.mjs
 *
 * Exemplos de nomes:
 * - letter-efesios.pdf (português - vai para originals/)
 * - letter-efesios-es.pdf (espanhol - vai para translated/)
 * - letter-romanos-en.pdf (inglês - vai para translated/)
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile, mkdir, rename } from 'fs/promises';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const BUCKET = 'pdfs';
const UPLOAD_DIR = './pdfs-to-upload';
const UPLOADED_DIR = './pdfs-uploaded'; // Pasta para PDFs já upados

async function uploadPDFs() {
  console.log('🚀 Iniciando upload automático de PDFs...\n');

  try {
    // Criar pasta de PDFs upados se não existir
    try {
      await mkdir(UPLOADED_DIR, { recursive: true });
    } catch (e) {
      // Pasta já existe, ok
    }

    // Ler arquivos da pasta
    const files = await readdir(UPLOAD_DIR);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.log('⚠️  Nenhum PDF encontrado em', UPLOAD_DIR);
      console.log('   Crie a pasta e coloque seus PDFs lá.');
      return;
    }

    console.log(`📁 Encontrados ${pdfFiles.length} PDFs para upload:\n`);

    let uploaded = 0;
    let failed = 0;

    for (const filename of pdfFiles) {
      try {
        // Detectar idioma e caminho
        const match = filename.match(/^(.+?)(?:-(es|en|fr))?\.pdf$/);
        if (!match) {
          console.log(`⚠️  Nome inválido (ignorando): ${filename}`);
          continue;
        }

        const productId = match[1];
        const language = match[2];

        const isOriginal = !language;
        const folder = isOriginal ? 'originals' : 'translated';
        const storagePath = `${folder}/${filename}`;

        console.log(`📤 Uploading ${filename}...`);
        console.log(`   → ${storagePath}`);

        // Ler arquivo
        const filePath = join(UPLOAD_DIR, filename);
        const fileBuffer = await readFile(filePath);
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });

        // Upload
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'application/pdf'
          });

        if (error) {
          console.log(`   ❌ ERRO: ${error.message}\n`);
          failed++;
        } else {
          const publicUrl = `https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs/${storagePath}`;
          console.log(`   ✅ Sucesso!`);
          console.log(`   🔗 ${publicUrl}`);

          // Mover para pasta de upados
          const oldPath = join(UPLOAD_DIR, filename);
          const newPath = join(UPLOADED_DIR, filename);
          await rename(oldPath, newPath);
          console.log(`   📦 Movido para pdfs-uploaded/\n`);

          uploaded++;
        }

      } catch (error) {
        console.log(`   ❌ Erro ao processar ${filename}:`, error.message, '\n');
        failed++;
      }

      // Delay para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total: ${pdfFiles.length}`);
    console.log('='.repeat(60));

    if (uploaded > 0) {
      console.log('\n🎉 Upload concluído! Recarregue seu app para ver os PDFs.');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

uploadPDFs();

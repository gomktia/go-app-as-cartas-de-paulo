#!/usr/bin/env node
/**
 * 🔄 SINCRONIZADOR DE CAPÍTULOS
 *
 * Escaneia PDFs no Supabase Storage e popula a tabela chapters automaticamente
 *
 * Uso:
 * 1. Execute: node sync-chapters.mjs
 * 2. O script vai:
 *    ✅ Listar todos os PDFs no Storage
 *    ✅ Detectar produto, idioma e número do capítulo
 *    ✅ Criar/atualizar capítulos no banco de dados
 *    ✅ Construir as URLs públicas corretas
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const BUCKET = 'pdfs';
const STORAGE_BASE = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs';

// Parse filename to extract metadata
function parseFilename(filename) {
  // Examples:
  // letter-romanos-es-cap-01.pdf -> { product_id: 'letter-romanos', language: 'es', chapter: 1 }
  // letter-romanos-cap-01.pdf -> { product_id: 'letter-romanos', language: 'pt', chapter: 1 }
  // letter-efesios.pdf -> { product_id: 'letter-efesios', language: 'pt', chapter: null }
  // letter-efesios-es.pdf -> { product_id: 'letter-efesios', language: 'es', chapter: null }

  const match = filename.match(/^(.+?)(?:-(es|en|fr))?(?:-cap-(\d+))?\.pdf$/);

  if (!match) {
    return null;
  }

  const productId = match[1];
  const language = match[2] || 'pt';
  const chapterNum = match[3] ? parseInt(match[3]) : null;

  return {
    productId,
    language,
    chapterNum,
    filename
  };
}

// Generate chapter title based on chapter number
function generateChapterTitle(productId, chapterNum, language) {
  const chapterWord = {
    'pt': 'Capítulo',
    'es': 'Capítulo',
    'en': 'Chapter',
    'fr': 'Chapitre'
  }[language] || 'Capítulo';

  return `${chapterWord} ${chapterNum}`;
}

async function syncChapters() {
  console.log('🔄 Sincronizando capítulos do Storage para o banco de dados...\n');

  try {
    // 1. List all files in Storage
    console.log('📁 Listando PDFs no Storage...');

    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list('originals', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      throw new Error(`Erro ao listar arquivos: ${listError.message}`);
    }

    if (!files || files.length === 0) {
      console.log('⚠️  Nenhum arquivo encontrado no Storage');
      return;
    }

    console.log(`✅ Encontrados ${files.length} arquivos no Storage\n`);

    // 2. Filter only chapter files (with -cap- in name)
    const chapterFiles = files.filter(f =>
      f.name.endsWith('.pdf') && f.name.includes('-cap-')
    );

    console.log(`📖 Encontrados ${chapterFiles.length} capítulos para sincronizar\n`);

    if (chapterFiles.length === 0) {
      console.log('ℹ️  Nenhum capítulo encontrado (arquivos precisam ter -cap-XX no nome)');
      return;
    }

    // 3. Parse and insert/update chapters
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of chapterFiles) {
      const parsed = parseFilename(file.name);

      if (!parsed || !parsed.chapterNum) {
        console.log(`⚠️  Ignorando ${file.name} (formato inválido)`);
        skipped++;
        continue;
      }

      const { productId, language, chapterNum, filename } = parsed;

      // Construct Storage URL
      const pdfUrl = `${STORAGE_BASE}/originals/${filename}`;

      // Generate title
      const title = generateChapterTitle(productId, chapterNum, language);

      // Create unique ID: product-language-chapter
      const chapterId = `${productId}-${language}-${chapterNum}`;

      console.log(`📄 Processando: ${filename}`);
      console.log(`   ID: ${chapterId}`);
      console.log(`   Produto: ${productId}`);
      console.log(`   Idioma: ${language.toUpperCase()}`);
      console.log(`   Capítulo: ${chapterNum}`);
      console.log(`   Título: ${title}`);

      try {
        // Use upsert to insert or update
        const { data, error } = await supabase
          .from('chapters')
          .upsert({
            id: chapterId,
            product_id: productId,
            title: title,
            order_index: chapterNum,
            pdf_url: pdfUrl,
            language: language,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select();

        if (error) {
          console.log(`   ❌ ERRO: ${error.message}\n`);
          failed++;
        } else {
          if (data && data.length > 0) {
            console.log(`   ✅ Sincronizado!`);
            console.log(`   🔗 ${pdfUrl}\n`);
            inserted++;
          } else {
            updated++;
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}\n`);
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`   ✅ Sincronizados: ${inserted}`);
    console.log(`   🔄 Atualizados: ${updated}`);
    console.log(`   ⏭️  Ignorados: ${skipped}`);
    console.log(`   ❌ Erros: ${failed}`);
    console.log(`   📁 Total: ${chapterFiles.length}`);
    console.log('='.repeat(60));

    if (inserted > 0 || updated > 0) {
      console.log('\n🎉 Sincronização concluída! Recarregue o app para ver os capítulos.');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

syncChapters();

#!/usr/bin/env node
/**
 * 🤖 RENOMEADOR AUTOMÁTICO DE PDFs
 *
 * Uso:
 * 1. Jogue seus PDFs na pasta pdfs-to-rename/
 * 2. Execute: node rename-pdfs.mjs
 * 3. O script detecta e renomeia automaticamente!
 */

import { readdir, rename } from 'fs/promises';
import { join } from 'path';
import readline from 'readline';

const RENAME_DIR = './pdfs-to-rename';

// Mapeamento de palavras-chave para IDs
const PRODUCT_MAPPING = {
  // Cartas Paulinas
  'romanos': 'letter-romanos',
  'romans': 'letter-romanos',
  '1 corintios': 'letter-1corintios',
  '1corintios': 'letter-1corintios',
  '1 corinthians': 'letter-1corintios',
  '2 corintios': 'letter-2corintios',
  '2corintios': 'letter-2corintios',
  '2 corinthians': 'letter-2corintios',
  'galatas': 'letter-galatas',
  'galatians': 'letter-galatas',
  'efesios': 'letter-efesios',
  'ephesians': 'letter-efesios',
  'filipenses': 'letter-filipenses',
  'philippians': 'letter-filipenses',
  'colossenses': 'letter-colossenses',
  'colossians': 'letter-colossenses',
  '1 tessalonicenses': 'letter-1tessalonicenses',
  '1tessalonicenses': 'letter-1tessalonicenses',
  '1 thessalonians': 'letter-1tessalonicenses',
  '2 tessalonicenses': 'letter-2tessalonicenses',
  '2tessalonicenses': 'letter-2tessalonicenses',
  '2 thessalonians': 'letter-2tessalonicenses',
  '1 timoteo': 'letter-1timoteo',
  '1timoteo': 'letter-1timoteo',
  '1 timothy': 'letter-1timoteo',
  '2 timoteo': 'letter-2timoteo',
  '2timoteo': 'letter-2timoteo',
  '2 timothy': 'letter-2timoteo',
  'tito': 'letter-tito',
  'titus': 'letter-tito',
  'filemom': 'letter-filemon',
  'filemon': 'letter-filemon',
  'philemon': 'letter-filemon',

  // Premium
  'pedro': 'premium-pedro',
  'peter': 'premium-pedro',
  'temor': 'premium-temor',
  'fear': 'premium-temor',
  'oracao': 'premium-oracao',
  'oração': 'premium-oracao',
  'prayer': 'premium-oracao',
  'santidade': 'premium-santidade',
  'holiness': 'premium-santidade',
  'mapa didatico': 'premium-mapa-biblia',
  'mapa didático': 'premium-mapa-biblia',
  'mapa didactico': 'premium-mapa-biblia',
  'mapa biblia': 'premium-mapa-biblia',
  'mapa bible': 'premium-mapa-biblia',
  'bible map': 'premium-mapa-biblia',
  'didactic map': 'premium-mapa-biblia',

  // Upsells
  'uncao': 'upsell-uncao',
  'unção': 'upsell-uncao',
  'leao': 'upsell-uncao',
  'leão': 'upsell-uncao',
  'apocalipse': 'upsell-apocalipse',
  'revelation': 'upsell-apocalipse',
  'pregador': 'upsell-pregador',
  'preacher': 'upsell-pregador',
  'mulher': 'upsell-mulher',
  'woman': 'upsell-mulher',
  'crista': 'upsell-mulher'
};

// Detectar número do capítulo
function detectChapterNumber(filename) {
  const lower = filename.toLowerCase();

  // Tentar extrair número do capítulo
  const patterns = [
    /cap[ií]tulo[- _]?(\d+)/i,
    /chapter[- _]?(\d+)/i,
    /chapitre[- _]?(\d+)/i,
    /cap[- _]?(\d+)/i,
    /ch[- _]?(\d+)/i,
    /-(\d+)\.pdf$/i  // Número no final antes do .pdf
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      return num.toString().padStart(2, '0'); // 1 -> "01"
    }
  }

  return null;
}

// Detectar idioma do arquivo
function detectLanguage(filename) {
  const lower = filename.toLowerCase();

  // Espanhol - mais palavras-chave
  if (lower.includes('-es') || lower.includes('espanol') || lower.includes('español') ||
      lower.includes('spanish') || lower.includes('-los-') || lower.includes('_los_') ||
      lower.includes('carta a los') || lower.includes('capitulo')) return 'es';

  // Inglês
  if (lower.includes('-en') || lower.includes('english') || lower.includes('ingles')) return 'en';

  // Francês
  if (lower.includes('-fr') || lower.includes('french') || lower.includes('frances') ||
      lower.includes('français')) return 'fr';

  return 'pt'; // Padrão português
}

// Tentar identificar o produto pelo nome do arquivo
function identifyProduct(filename) {
  const lower = filename.toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  // Tentar match exato primeiro
  for (const [keyword, productId] of Object.entries(PRODUCT_MAPPING)) {
    if (lower.includes(keyword)) {
      return productId;
    }
  }

  return null;
}

// Interface para perguntar ao usuário
function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function renamePDFs() {
  console.log('🤖 RENOMEADOR AUTOMÁTICO DE PDFs\n');
  console.log('=' .repeat(70));

  try {
    const files = await readdir(RENAME_DIR);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.log('⚠️  Nenhum PDF encontrado em', RENAME_DIR);
      console.log('   Crie a pasta e coloque seus PDFs lá.\n');
      return;
    }

    console.log(`\n📁 Encontrados ${pdfFiles.length} PDFs:\n`);

    let renamed = 0;
    let skipped = 0;

    for (const filename of pdfFiles) {
      console.log(`📄 Processando: ${filename}`);

      // Detectar produto
      const productId = identifyProduct(filename);
      const language = detectLanguage(filename);

      if (productId) {
        // Detectar número do capítulo
        const chapterNum = detectChapterNumber(filename);

        // Construir novo nome
        let newName;
        if (chapterNum) {
          // Tem capítulo - incluir número
          newName = language === 'pt'
            ? `${productId}-cap-${chapterNum}.pdf`
            : `${productId}-${language}-cap-${chapterNum}.pdf`;
        } else {
          // Sem capítulo - arquivo único
          newName = language === 'pt'
            ? `${productId}.pdf`
            : `${productId}-${language}.pdf`;
        }

        // Verificar se já está correto
        if (filename === newName) {
          console.log(`   ✅ Já está correto!\n`);
          skipped++;
          continue;
        }

        // Perguntar confirmação
        console.log(`   🎯 Detectado: ${productId}`);
        console.log(`   🌍 Idioma: ${language === 'pt' ? 'Português' : language.toUpperCase()}`);
        if (chapterNum) {
          console.log(`   📖 Capítulo: ${chapterNum}`);
        }
        console.log(`   📝 Novo nome: ${newName}`);

        const answer = await askUser('   Confirmar? (s/n/pular): ');

        if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim' || answer.toLowerCase() === 'y') {
          const oldPath = join(RENAME_DIR, filename);
          const newPath = join(RENAME_DIR, newName);

          await rename(oldPath, newPath);
          console.log(`   ✅ Renomeado com sucesso!\n`);
          renamed++;
        } else if (answer.toLowerCase() === 'p' || answer.toLowerCase() === 'pular') {
          console.log(`   ⏭️  Pulado\n`);
          skipped++;
        } else {
          console.log(`   ❌ Cancelado\n`);
          skipped++;
        }
      } else {
        // Não conseguiu identificar - pedir ajuda ao usuário
        console.log(`   ⚠️  Não consegui identificar automaticamente`);

        // Detectar capítulo mesmo sem produto
        const chapterNum = detectChapterNumber(filename);
        if (chapterNum) {
          console.log(`   📖 Capítulo detectado: ${chapterNum}`);
        }

        console.log(`   Digite o ID do produto (ou 'pular'):`);

        const answer = await askUser('   ID: ');

        if (answer.toLowerCase() === 'pular' || answer === '') {
          console.log(`   ⏭️  Pulado\n`);
          skipped++;
          continue;
        }

        // Construir nome com capítulo se detectado
        let newName;
        if (chapterNum) {
          newName = language === 'pt'
            ? `${answer}-cap-${chapterNum}.pdf`
            : `${answer}-${language}-cap-${chapterNum}.pdf`;
        } else {
          newName = language === 'pt'
            ? `${answer}.pdf`
            : `${answer}-${language}.pdf`;
        }

        const oldPath = join(RENAME_DIR, filename);
        const newPath = join(RENAME_DIR, newName);

        await rename(oldPath, newPath);
        console.log(`   ✅ Renomeado para: ${newName}\n`);
        renamed++;
      }
    }

    console.log('=' .repeat(70));
    console.log('\n📊 RESUMO:');
    console.log(`   ✅ Renomeados: ${renamed}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   📁 Total: ${pdfFiles.length}`);
    console.log('=' .repeat(70));

    if (renamed > 0) {
      console.log('\n🎉 Agora execute: node upload-pdfs.mjs');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

renamePDFs();

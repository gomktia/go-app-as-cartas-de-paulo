#!/usr/bin/env node
/**
 * Lista todos os IDs dos produtos
 * Use estes IDs EXATAMENTE para nomear seus PDFs
 */

import { PRODUCTS } from './constants.tsx';

console.log('📋 IDs EXATOS para usar nos nomes dos PDFs:\n');
console.log('=' .repeat(70));
console.log('COPIE EXATAMENTE ESTES NOMES!\n');

PRODUCTS.forEach((product, index) => {
  const id = product.id;
  const title = product.title;
  const category = product.category;

  console.log(`${(index + 1).toString().padStart(2)}. ${id}`);
  console.log(`    Título: ${title}`);
  console.log(`    Categoria: ${category}`);

  // Exemplos de uso
  console.log(`    Português: ${id}.pdf`);
  console.log(`    Espanhol:  ${id}-es.pdf`);
  console.log(`    Inglês:    ${id}-en.pdf`);
  console.log(`    Francês:   ${id}-fr.pdf`);
  console.log('');
});

console.log('=' .repeat(70));
console.log('\n💡 DICA: Copie e cole o ID exato ao renomear seus PDFs!');
console.log('⚠️  ATENÇÃO: Maiúsculas e minúsculas fazem diferença!\n');

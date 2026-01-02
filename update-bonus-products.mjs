import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const STORAGE_BASE = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs/translated';

const bonusUpdates = [
  {
    oldTitle: 'A IMPORTÂNCIA DE TEMER A DEUS',
    newTitle: 'Pablo y la Ansiedad',
    subtitle: 'PAZ EN MEDIO DE LA TORMENTA',
    pdfFile: 'bonus-ansiedad-es.pdf'
  },
  {
    oldTitle: 'COMO TER UMA VIDA DE ORAÇÃO ',
    newTitle: 'Pablo y la Culpa Religiosa',
    subtitle: 'LIBERTAD DE LA CULPA',
    pdfFile: 'bonus-culpa-es.pdf'
  },
  {
    oldTitle: 'COMO TER INTÍMIDADE COM DEUS',
    newTitle: 'Pablo y el Matrimonio',
    subtitle: 'ENSEÑANZAS SOBRE EL MATRIMONIO',
    pdfFile: 'bonus-matrimonio-es.pdf'
  },
  {
    oldTitle: 'VENCENDO BATALHAS ESPIRITUAIS',
    newTitle: 'Pablo en el Día a Día',
    subtitle: 'VIDA CRISTIANA PRÁCTICA',
    pdfFile: 'bonus-diaadia-es.pdf'
  }
];

async function updateBonusProducts() {
  console.log('🔄 Atualizando produtos de bônus...\n');

  for (const bonus of bonusUpdates) {
    const pdfUrl = `${STORAGE_BASE}/${bonus.pdfFile}`;

    const { data, error } = await supabase
      .from('products')
      .update({
        title: bonus.newTitle,
        subtitle: bonus.subtitle,
        pdf_url: pdfUrl
      })
      .eq('title', bonus.oldTitle)
      .select();

    if (error) {
      console.log(`❌ ${bonus.oldTitle}: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ ${bonus.oldTitle} → ${bonus.newTitle}`);
    } else {
      console.log(`⚠️  Produto não encontrado: ${bonus.oldTitle}`);
    }
  }

  console.log('\n✅ Atualização concluída!');
}

updateBonusProducts();

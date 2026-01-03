import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_KEY
);

const STORAGE_BASE = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs/translated';

const updates = [
    {
        title: 'Pablo y la Culpa Religiosa',
        file: 'bonus-culpa-es.pdf'
    },
    {
        title: 'Pablo y la Ansiedad',
        file: 'bonus-ansiedad-es.pdf'
    },
    {
        title: 'Pablo y el Matrimonio',
        file: 'bonus-matrimonio-es.pdf'
    },
    {
        title: 'Pablo en el Día a Día',
        file: 'bonus-diaadia-es.pdf'
    },
    // Adding the Spanish version of the titles just in case they differ slightly or if there are others
    {
        title: 'Pablo y la Culpa Religiosa',
        file: 'bonus-culpa-es.pdf'
    }
];

async function fixBonusUrls() {
    console.log('🔧 Corrigindo URLs dos produtos bônus...\n');

    for (const item of updates) {
        const pdfUrl = `${STORAGE_BASE}/${item.file}`;
        console.log(`Verificando: ${item.title}`);
        console.log(`URL esperada: ${pdfUrl}`);

        // Check if product exists first
        const { data: existing } = await supabase
            .from('products')
            .select('id, title, pdf_url')
            .eq('title', item.title);

        if (existing && existing.length > 0) {
            console.log(`   ✅ Produto encontrado: ${existing[0].title} (ID: ${existing[0].id})`);
            console.log(`      URL atual: ${existing[0].pdf_url}`);

            // Update
            const { error } = await supabase
                .from('products')
                .update({
                    pdf_url: pdfUrl,
                    category: 'BONUS', // Ensure it is BONUS category
                    tier: 'BASIC'      // Ensure it is BASIC tier
                })
                .eq('title', item.title);

            if (error) {
                console.log(`   ❌ Erro ao atualizar: ${error.message}`);
            } else {
                console.log(`   ✨ Atualizado com sucesso!`);
            }
        } else {
            console.log(`   ⚠️  Produto não encontrado com esse título exato.`);
        }
        console.log('---');
    }

    console.log('\n🏁 Processo finalizado.');
}

fixBonusUrls();

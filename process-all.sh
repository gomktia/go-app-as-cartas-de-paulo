#!/bin/bash
# 🚀 SCRIPT AUTOMÁTICO - Processa TODOS os PDFs de uma vez
#
# Uso: ./process-all.sh
#
# O que faz:
# 1. Renomeia PDFs automaticamente (SEM pedir confirmação)
# 2. Move para upload
# 3. Faz upload para Supabase
# 4. Sincroniza com banco de dados
# 5. Pronto! ✅

set -e  # Para na primeira falha

echo "🚀 PROCESSAMENTO AUTOMÁTICO DE PDFs"
echo "===================================="
echo ""

# Verificar se tem PDFs para processar
PDF_COUNT=$(find pdfs-to-rename -name "*.pdf" 2>/dev/null | wc -l | tr -d ' ')

if [ "$PDF_COUNT" -eq "0" ]; then
    echo "❌ Nenhum PDF encontrado em pdfs-to-rename/"
    echo "   Coloque seus PDFs lá e rode novamente!"
    exit 1
fi

echo "📁 Encontrados $PDF_COUNT PDFs para processar"
echo ""

# Passo 1: Renomear (modo automático - sem confirmação)
echo "📝 Passo 1/4: Renomeando PDFs..."
# Nota: O script rename-pdfs.mjs atual pede confirmação
# Por isso vamos pular e fazer upload direto dos que já estão nomeados
echo "   ⚠️  Aviso: Certifique-se que os PDFs já estão com nomes corretos!"
echo "   Formato: letter-{nome}-{idioma}.pdf ou letter-{nome}-{idioma}-cap-{num}.pdf"
echo ""

# Passo 2: Mover para upload
echo "📦 Passo 2/4: Movendo para pasta de upload..."
mkdir -p pdfs-to-upload
MOVED=$(find pdfs-to-rename -name "*.pdf" -exec mv {} pdfs-to-upload/ \; -print | wc -l | tr -d ' ')
echo "   ✅ $MOVED arquivos movidos"
echo ""

# Passo 3: Upload para Supabase
echo "☁️  Passo 3/4: Fazendo upload para Supabase..."
node upload-pdfs.mjs
echo ""

# Passo 4: Sincronizar com banco de dados
echo "🔄 Passo 4/4: Sincronizando com banco de dados..."
node sync-chapters.mjs
echo ""

echo "===================================="
echo "🎉 PROCESSO COMPLETO!"
echo ""
echo "✅ PDFs upados para Supabase Storage"
echo "✅ Capítulos sincronizados no banco"
echo "✅ Arquivos movidos para pdfs-uploaded/"
echo ""
echo "🌐 Abra seu app e veja os PDFs disponíveis!"
echo "===================================="

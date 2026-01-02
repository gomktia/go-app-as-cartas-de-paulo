# 🚀 WORKFLOW COMPLETO - Upload de PDFs

## Opção 1: RENOMEAR AUTOMÁTICO (RECOMENDADO!) 🤖

**Melhor para:** Muitos PDFs com nomes variados

### Passo a passo:

```bash
# 1. Jogue seus PDFs (qualquer nome) aqui:
pdfs-to-rename/
  ├── Carta aos Romanos.pdf
  ├── Efesios - Espanhol.pdf
  ├── 1 Corintios English.pdf
  └── pedro.pdf

# 2. Execute o renomeador automático:
node rename-pdfs.mjs

# O script vai:
#   ✅ Detectar automaticamente qual produto é
#   ✅ Detectar o idioma (pt/es/en/fr)
#   ✅ Sugerir o novo nome
#   ✅ Pedir confirmação
#   ✅ Renomear automaticamente!

# 3. Os arquivos ficam assim:
pdfs-to-rename/
  ├── letter-romanos.pdf
  ├── letter-efesios-es.pdf
  ├── letter-1corintios-en.pdf
  └── premium-pedro.pdf

# 4. Agora faça upload:
node upload-pdfs.mjs
```

### Como funciona a detecção:

O script reconhece automaticamente palavras-chave:
- "romanos", "romans" → `letter-romanos`
- "efesios", "ephesians" → `letter-efesios`
- "1 corintios", "1 corinthians" → `letter-1corintios`
- "pedro", "peter" → `premium-pedro`
- etc.

**Idiomas:**
- Sem sufixo ou "portugues" → Português (original)
- "-es", "espanol", "spanish" → Espanhol
- "-en", "english", "ingles" → Inglês
- "-fr", "french", "frances" → Francês

---

## Opção 2: RENOMEAR MANUAL

**Melhor para:** Poucos PDFs

```bash
# 1. Renomeie manualmente consultando NOMES-DOS-PDFS.txt
# 2. Coloque em pdfs-to-upload/
# 3. Execute: node upload-pdfs.mjs
```

---

## Opção 3: WORKFLOW COMPLETO (do zero ao ar)

```bash
# 1️⃣ RENOMEAR
#    Jogue PDFs em pdfs-to-rename/
node rename-pdfs.mjs

# 2️⃣ MOVER
#    PDFs renomeados vão automaticamente para pdfs-to-upload/
#    (ou mova manualmente)

# 3️⃣ UPLOAD
#    Faz upload para Supabase Storage
node upload-pdfs.mjs

# 4️⃣ VERIFICAR
#    Abre o app e testa
npm run dev
```

---

## 🎯 Exemplo Prático

Você tem 50 PDFs com nomes tipo:
- `Romanos - A Justiça de Deus.pdf`
- `Efésios Espanhol.pdf`
- `1 Coríntios English Version.pdf`
- `Pedro - Historia do Apostolo.pdf`

**Processo automático:**

```bash
# Coloca todos em pdfs-to-rename/
node rename-pdfs.mjs

# Script detecta e pergunta:
📄 Processando: Romanos - A Justiça de Deus.pdf
   🎯 Detectado: letter-romanos
   🌍 Idioma: Português
   📝 Novo nome: letter-romanos.pdf
   Confirmar? (s/n/pular): s
   ✅ Renomeado com sucesso!

📄 Processando: Efésios Espanhol.pdf
   🎯 Detectado: letter-efesios
   🌍 Idioma: ES
   📝 Novo nome: letter-efesios-es.pdf
   Confirmar? (s/n/pular): s
   ✅ Renomeado com sucesso!

# Depois do rename:
node upload-pdfs.mjs

# Pronto! Todos os 50 PDFs renomeados e enviados! 🎉
```

---

## ⚡ Dicas Pro

1. **Sempre use o renomeador automático primeiro** - economiza 90% do tempo
2. **Se não detectar, digite o ID** - o script pergunta
3. **Use 's' para confirmar rapidamente** - não precisa digitar 'sim'
4. **Pode processar em lotes** - não precisa fazer todos de uma vez

---

## 🆘 Troubleshooting

**"Não consegui identificar"**
→ Digite o ID manualmente quando o script perguntar

**"Arquivo já existe"**
→ O script usa `upsert: true`, vai sobrescrever

**"Muitos arquivos, cansativo confirmar um por um"**
→ Versão futura: modo --auto (confirma tudo)

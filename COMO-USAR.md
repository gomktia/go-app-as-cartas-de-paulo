# 🚀 COMO USAR O SISTEMA DE PDFs - GUIA COMPLETO

## 📋 RESUMO RÁPIDO

Este sistema permite fazer upload de PDFs com **3 comandos simples**:

```bash
# 1. Renomear PDFs automaticamente
node rename-pdfs.mjs

# 2. Fazer upload para o Supabase Storage
node upload-pdfs.mjs

# 3. Sincronizar com o banco de dados
node sync-chapters.mjs
```

Pronto! Seus PDFs aparecerão no app em todos os idiomas! 🎉

---

## 🎯 WORKFLOW COMPLETO (Passo a Passo)

### **PASSO 1: Preparar os PDFs**

Coloque seus PDFs (qualquer nome) na pasta `pdfs-to-rename/`:

```
pdfs-to-rename/
  ├── Carta aos Romanos Capitulo 1.pdf
  ├── Romanos Capitulo 2 - Espanhol.pdf
  ├── Romans Chapter 3.pdf
  └── ...
```

### **PASSO 2: Renomear Automaticamente**

Execute o renomeador:

```bash
node rename-pdfs.mjs
```

O script vai:
- ✅ Detectar automaticamente qual produto é (Romanos, Efésios, etc.)
- ✅ Detectar o idioma (PT/ES/EN/FR)
- ✅ Detectar o número do capítulo (se houver)
- ✅ Sugerir o novo nome padronizado
- ✅ Pedir sua confirmação

**Exemplos de detecção:**

| Nome Original | Detecta | Novo Nome |
|---------------|---------|-----------|
| `Romanos Capitulo 1.pdf` | Romanos, PT, Cap 1 | `letter-romanos-cap-01.pdf` |
| `Carta a los Romanos Capitulo 2.pdf` | Romanos, ES, Cap 2 | `letter-romanos-es-cap-02.pdf` |
| `Romans Chapter 3.pdf` | Romanos, EN, Cap 3 | `letter-romanos-en-cap-03.pdf` |
| `Efesios.pdf` | Efésios, PT, sem cap | `letter-efesios.pdf` |

**Dica:** Digite apenas `s` e ENTER para confirmar rapidamente!

### **PASSO 3: Mover PDFs Renomeados**

Mova os arquivos renomeados para a pasta de upload:

```bash
mv pdfs-to-rename/*.pdf pdfs-to-upload/
```

### **PASSO 4: Fazer Upload para o Supabase Storage**

Execute o uploader:

```bash
node upload-pdfs.mjs
```

O script vai:
- ✅ Ler todos os PDFs de `pdfs-to-upload/`
- ✅ Fazer upload para o Supabase Storage
- ✅ Organizar em pastas: `originals/` (PT) ou `translated/` (ES/EN/FR)
- ✅ Mover automaticamente os PDFs upados para `pdfs-uploaded/`

**Resultado:**

```
Supabase Storage (pdfs/):
  ├── originals/
  │   ├── letter-romanos-cap-01.pdf
  │   ├── letter-romanos-cap-02.pdf
  │   ├── letter-romanos-es-cap-01.pdf
  │   ├── letter-romanos-es-cap-02.pdf
  │   └── ...
```

### **PASSO 5: Sincronizar com o Banco de Dados**

**PRIMEIRO, execute a migration no Supabase:**

1. Vá até Supabase Dashboard → SQL Editor
2. Execute o SQL do arquivo `migrations/005_chapters_table.sql`
3. Verifique se apareceu "Success. No rows returned"

**DEPOIS, execute o sincronizador:**

```bash
node sync-chapters.mjs
```

O script vai:
- ✅ Escanear todos os PDFs no Storage
- ✅ Criar/atualizar capítulos no banco de dados
- ✅ Construir as URLs públicas corretas
- ✅ Associar cada capítulo ao produto e idioma correto

**Resultado:**

```
Banco de Dados (chapters):
┌─────────────────────────┬──────────────────┬─────────────┬──────────────┐
│ id                      │ product_id       │ language    │ order_index  │
├─────────────────────────┼──────────────────┼─────────────┼──────────────┤
│ letter-romanos-pt-1     │ letter-romanos   │ pt          │ 1            │
│ letter-romanos-pt-2     │ letter-romanos   │ pt          │ 2            │
│ letter-romanos-es-1     │ letter-romanos   │ es          │ 1            │
│ letter-romanos-es-2     │ letter-romanos   │ es          │ 2            │
└─────────────────────────┴──────────────────┴─────────────┴──────────────┘
```

### **PASSO 6: Verificar no App**

1. Abra o app: `npm run dev`
2. Troque para Espanhol (bandeira da Espanha no canto superior direito)
3. Clique em "Romanos"
4. Você verá a lista de capítulos!
5. Clique em qualquer capítulo para abrir o PDF

---

## 🔄 PRÓXIMAS VEZES (Mais PDFs)

Quando você tiver **mais PDFs para adicionar**, faça assim:

```bash
# 1. Jogue os novos PDFs em pdfs-to-rename/
# 2. Renomeie
node rename-pdfs.mjs

# 3. Mova para upload
mv pdfs-to-rename/*.pdf pdfs-to-upload/

# 4. Upload (só vai upar os novos!)
node upload-pdfs.mjs

# 5. Sincronize
node sync-chapters.mjs
```

**Não precisa re-upar os antigos!** Os PDFs já upados ficam em `pdfs-uploaded/` e não serão processados novamente.

---

## 📚 ESTRUTURA DE NOMES DOS PRODUTOS

### Cartas Paulinas (13 cartas):

- `letter-romanos`
- `letter-1corintios`
- `letter-2corintios`
- `letter-galatas`
- `letter-efesios`
- `letter-filipenses`
- `letter-colossenses`
- `letter-1tessalonicenses`
- `letter-2tessalonicenses`
- `letter-1timoteo`
- `letter-2timoteo`
- `letter-tito`
- `letter-filemon`

### Bônus Premium (4 estudos):

- `premium-pedro`
- `premium-temor`
- `premium-oracao`
- `premium-santidade`

### Arsenal Espiritual (4 upsells):

- `upsell-uncao`
- `upsell-apocalipse`
- `upsell-pregador`
- `upsell-mulher`

---

## 🌍 IDIOMAS SUPORTADOS

- **PT** (Português) - padrão, sem sufixo
- **ES** (Espanhol) - sufixo `-es`
- **EN** (Inglês) - sufixo `-en`
- **FR** (Francês) - sufixo `-fr`

### Exemplos de Nomes:

**Produto único (sem capítulos):**
- Português: `letter-efesios.pdf`
- Espanhol: `letter-efesios-es.pdf`
- Inglês: `letter-efesios-en.pdf`

**Produto com capítulos:**
- Português Cap 1: `letter-romanos-cap-01.pdf`
- Espanhol Cap 1: `letter-romanos-es-cap-01.pdf`
- Inglês Cap 1: `letter-romanos-en-cap-01.pdf`

---

## ⚡ DICAS PROFISSIONAIS

1. **Use o renomeador SEMPRE** - economiza 90% do tempo
2. **Digite só "s"** - não precisa escrever "sim"
3. **Processe em lotes** - não precisa fazer todos de uma vez
4. **Verifique a pasta `pdfs-uploaded/`** - para ver o que já foi enviado
5. **Use o sincronizador sempre após upload** - para atualizar o banco

---

## 🆘 TROUBLESHOOTING

### "Não consegui identificar o produto"

→ O script vai perguntar: digite o ID manualmente (exemplo: `letter-romanos`)

### "O idioma detectado está errado"

→ Digite "n" para cancelar, renomeie manualmente, e rode novamente

### "Apareceu no terminal mas não no app"

→ Você esqueceu de rodar `node sync-chapters.mjs`!

### "Erro 'chapters table does not exist'"

→ Execute a migration `005_chapters_table.sql` no Supabase SQL Editor

### "PDFs duplicados"

→ O upload usa `upsert: true`, vai sobrescrever automaticamente

---

## 📊 ARQUIVOS DO SISTEMA

| Arquivo | Função |
|---------|--------|
| `rename-pdfs.mjs` | Renomeia PDFs automaticamente |
| `upload-pdfs.mjs` | Faz upload para Supabase Storage |
| `sync-chapters.mjs` | Sincroniza Storage → Banco de Dados |
| `pdfs-to-rename/` | Coloque PDFs com qualquer nome aqui |
| `pdfs-to-upload/` | PDFs prontos para upload |
| `pdfs-uploaded/` | PDFs já enviados (histórico) |
| `NOMES-DOS-PDFS.txt` | Referência de todos os IDs de produtos |

---

## 🎉 PRONTO!

Agora você tem um sistema **100% automático** para gerenciar PDFs em múltiplos idiomas!

**Qualquer dúvida, execute:**
```bash
node rename-pdfs.mjs --help   # (futuro)
node upload-pdfs.mjs --help   # (futuro)
node sync-chapters.mjs --help # (futuro)
```

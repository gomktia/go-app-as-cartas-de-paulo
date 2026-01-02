# 📤 Guia de Upload Automático de PDFs

## Como Usar

### 1️⃣ Prepare seus PDFs

Renomeie seus arquivos PDF seguindo este padrão:

**Português (original):**
- `letter-efesios.pdf`
- `letter-romanos.pdf`
- `letter-galatas.pdf`

**Outros idiomas:**
- `letter-efesios-es.pdf` (Espanhol)
- `letter-efesios-en.pdf` (Inglês)
- `letter-efesios-fr.pdf` (Francês)

### 2️⃣ Coloque os PDFs na pasta

```bash
pdfs-to-upload/
  ├── letter-efesios.pdf
  ├── letter-efesios-es.pdf
  ├── letter-efesios-en.pdf
  ├── letter-romanos.pdf
  └── letter-romanos-es.pdf
```

### 3️⃣ Execute o script

```bash
node upload-pdfs.mjs
```

### 4️⃣ Pronto!

O script vai:
- ✅ Detectar o idioma automaticamente
- ✅ Fazer upload para o Supabase Storage
- ✅ Colocar no caminho correto (originals/ ou translated/)
- ✅ Mostrar progresso em tempo real

## 📋 Lista de IDs dos Produtos

Use estes IDs para nomear seus PDFs:

### Cartas Paulinas
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

### Bônus Premium
- `premium-pedro`
- `premium-temor`
- `premium-oracao`
- `premium-santidade`

### Upsells
- `upsell-uncao`
- `upsell-apocalipse`
- `upsell-pregador`
- `upsell-mulher`

## 💡 Dicas

1. **Português**: Não adicione sufixo de idioma (ex: `letter-efesios.pdf`)
2. **Traduções**: Adicione `-es`, `-en` ou `-fr` (ex: `letter-efesios-es.pdf`)
3. **Nomes**: Use exatamente os IDs da lista acima
4. **Formato**: Sempre `.pdf` em minúsculo

## 🔍 Verificar Upload

Depois do upload, acesse:
```
https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs/originals/letter-efesios.pdf
```

Troque `letter-efesios` pelo ID do seu produto.

## ❌ Solução de Problemas

**"Nenhum PDF encontrado"**
→ Verifique se os PDFs estão na pasta `pdfs-to-upload/`

**"Nome inválido"**
→ Verifique o formato: `{id}.pdf` ou `{id}-{lang}.pdf`

**"Erro ao fazer upload"**
→ Verifique se executou os SQLs das migrations (002, 003, 004)

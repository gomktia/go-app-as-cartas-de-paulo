# 🚀 WORKFLOW SIMPLIFICADO - Upload de PDFs

## 📋 Processo Completo (3 Comandos)

```bash
# 1️⃣ Renomear PDFs automaticamente
node rename-pdfs.mjs

# 2️⃣ Mover para pasta de upload
mv pdfs-to-rename/*.pdf pdfs-to-upload/

# 3️⃣ Fazer upload + sincronizar
node upload-pdfs.mjs && node sync-chapters.mjs
```

Pronto! PDFs aparecem no app automaticamente! 🎉

---

## 🎯 PASSO A PASSO DETALHADO

### **PASSO 1: Baixar PDFs do Google Drive**

1. Abra seu Google Drive
2. Selecione todos os PDFs que quer adicionar
3. Clique com botão direito → **Download**
4. Extraia o ZIP (se vier compactado)

### **PASSO 2: Mover para Pasta de Renomeação**

Coloque todos os PDFs baixados em:
```
pdfs-to-rename/
```

Pode ser qualquer nome, exemplo:
- `Carta aos Romanos.pdf`
- `Efesios Capitulo 1.pdf`
- `Romans Chapter 5 Spanish.pdf`

### **PASSO 3: Renomear Automaticamente**

Abra o Terminal e digite:

```bash
node rename-pdfs.mjs
```

O script vai:
- ✅ Detectar produto (Romanos, Efésios, etc.)
- ✅ Detectar idioma (PT/ES/EN/FR)
- ✅ Detectar número do capítulo (se houver)
- ✅ Perguntar confirmação

**Dica:** Digite só `s` + ENTER para confirmar rapidamente!

### **PASSO 4: Mover para Upload**

```bash
mv pdfs-to-rename/*.pdf pdfs-to-upload/
```

### **PASSO 5: Upload + Sincronização Automática**

```bash
node upload-pdfs.mjs && node sync-chapters.mjs
```

Este comando faz TUDO automaticamente:
- ✅ Upload para Supabase Storage
- ✅ Move PDFs upados para `pdfs-uploaded/`
- ✅ Sincroniza com banco de dados
- ✅ PDFs aparecem no app imediatamente!

### **PASSO 6: Verificar no App**

1. O app **recarrega sozinho** quando você troca de idioma
2. Clique no produto (ex: "Romanos")
3. Veja a lista de capítulos
4. Abra qualquer PDF!

---

## 🔄 PRÓXIMAS VEZES

Quando tiver mais PDFs:

```bash
# 1. Baixe do Drive e jogue em pdfs-to-rename/

# 2. Renomeie
node rename-pdfs.mjs

# 3. Mova
mv pdfs-to-rename/*.pdf pdfs-to-upload/

# 4. Upload + Sync (tudo de uma vez)
node upload-pdfs.mjs && node sync-chapters.mjs

# Pronto! ✅
```

**Importante:** PDFs já upados ficam em `pdfs-uploaded/` e **NÃO serão re-upados!**

---

## 📁 ESTRUTURA DE PASTAS

```
App-as-Cartas-de-Paulo-main/
  ├── pdfs-to-rename/       👈 Jogue PDFs aqui (qualquer nome)
  ├── pdfs-to-upload/       👈 PDFs prontos para upload
  ├── pdfs-uploaded/        👈 PDFs já enviados (histórico)
  ├── rename-pdfs.mjs       👈 Script de renomeação
  ├── upload-pdfs.mjs       👈 Script de upload
  └── sync-chapters.mjs     👈 Script de sincronização
```

---

## 🌍 IDIOMAS

O script detecta automaticamente:

| Se o nome contém... | Detecta como... |
|---------------------|-----------------|
| (nada) ou "portugues" | 🇧🇷 PT (padrão) |
| "-es", "espanol", "spanish" | 🇪🇸 ES |
| "-en", "english", "ingles" | 🇬🇧 EN |
| "-fr", "french", "frances" | 🇫🇷 FR |

---

## 📖 EXEMPLOS DE RENOMEAÇÃO

| Nome Original | Detecta | Novo Nome |
|---------------|---------|-----------|
| `Romanos.pdf` | Romanos, PT | `letter-romanos.pdf` |
| `Romanos Capitulo 5.pdf` | Romanos PT Cap 5 | `letter-romanos-cap-05.pdf` |
| `Romans Chapter 10.pdf` | Romanos EN Cap 10 | `letter-romanos-en-cap-10.pdf` |
| `Carta a los Romanos Capitulo 3.pdf` | Romanos ES Cap 3 | `letter-romanos-es-cap-03.pdf` |

---

## ⚡ MELHORIAS DO SISTEMA

### ✅ Já Implementado:

- [x] Renomeação automática de PDFs
- [x] Upload automático para Supabase
- [x] Sincronização automática com banco de dados
- [x] PDFs upados movem automaticamente para pasta de histórico
- [x] App recarrega sozinho ao trocar idioma
- [x] Capítulos aparecem por idioma automaticamente

### 🎯 Características:

- **Sem duplicação:** PDFs já upados não são re-enviados
- **Multi-idioma:** Suporte para PT, ES, EN, FR
- **Multi-capítulo:** Produtos podem ter quantos capítulos quiser
- **Auto-organização:** Tudo é movido e organizado automaticamente
- **UX perfeita:** Usuário troca idioma e vê conteúdo imediatamente

---

## 🆘 TROUBLESHOOTING

### "Script não encontrou PDFs"
→ Verifique se está na pasta correta: `cd /Users/pantera/Downloads/App-as-Cartas-de-Paulo-main`

### "Não consegui identificar o produto"
→ Digite o ID manualmente quando o script perguntar (ex: `letter-romanos`)

### "Idioma detectado errado"
→ Digite `n` para cancelar e renomeie manualmente com sufixo `-es`, `-en` ou `-fr`

### "PDFs não aparecem no app"
→ Certifique-se de executar `node sync-chapters.mjs` após o upload

### "Capítulos aparecem mas PDF não abre"
→ Verifique se o nome do arquivo está correto no Storage

---

## 🎉 RESUMO

1. **Baixe** PDFs do Drive
2. **Jogue** em `pdfs-to-rename/`
3. **Execute** `node rename-pdfs.mjs`
4. **Mova** para `pdfs-to-upload/`
5. **Execute** `node upload-pdfs.mjs && node sync-chapters.mjs`
6. **Pronto!** Abra o app e veja seus PDFs!

**Tempo estimado:** 2-5 minutos para processar 50 PDFs! ⚡

---

## 📞 COMANDOS ÚTEIS

```bash
# Ver PDFs em cada pasta
ls pdfs-to-rename/
ls pdfs-to-upload/
ls pdfs-uploaded/

# Contar quantos PDFs tem em cada pasta
ls pdfs-to-rename/*.pdf | wc -l
ls pdfs-to-upload/*.pdf | wc -l
ls pdfs-uploaded/*.pdf | wc -l

# Limpar pasta de upload (se quiser recomeçar)
rm pdfs-to-upload/*.pdf

# Ver logs do último upload
# (aparece automaticamente ao executar os scripts)
```

---

**Dúvidas?** Consulte `COMO-USAR.md` para detalhes completos! 📚

# 🚀 Guia de Integração Hotmart

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Configuração do Banco de Dados](#1-configuração-do-banco-de-dados)
3. [Configuração da Hotmart](#2-configuração-da-hotmart)
4. [Configuração do Vercel](#3-configuração-do-vercel)
5. [Integração no App](#4-integração-no-app)
6. [Testando a Integração](#5-testando-a-integração)
7. [Troubleshooting](#troubleshooting)

---

## Visão Geral

### Fluxo Completo
```
Cliente compra na Hotmart
    ↓
Hotmart envia Webhook → https://seuapp.vercel.app/api/hotmart-webhook
    ↓
API processa e salva no Supabase
    ↓
Cliente faz login com email
    ↓
App verifica compras e libera conteúdo automaticamente
```

---

## 1️⃣ Configuração do Banco de Dados

### Passo 1: Executar SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `setup-hotmart-integration.sql`
4. Execute o script

Isso criará:
- ✅ Tabela `users` (usuários)
- ✅ Tabela `purchases` (compras)
- ✅ Tabela `hotmart_products` (mapeamento de produtos)
- ✅ View `user_purchases_view` (consulta fácil)
- ✅ Função `process_hotmart_webhook` (processar webhooks)

### Passo 2: Configurar Produto Hotmart

Após criar seu produto na Hotmart, copie o **Product ID** e execute:

```sql
-- Substituir PRODUTO_HOTMART_ID_AQUI pelo ID real
update hotmart_products
set hotmart_product_id = 'SEU_PRODUTO_ID_AQUI'
where product_name = 'As Cartas de Paulo - Completo';
```

### Passo 3: Configurar Auth no Supabase

1. Vá em **Authentication** > **Providers**
2. Habilite **Email**
3. Configure o template de email:
   - **Subject**: `Seu código de acesso - As Cartas de Paulo`
   - **Body**: Customize conforme necessário

4. Em **Email Templates** > **Magic Link**:
```html
<h2>Seu Código de Acesso</h2>
<p>Use o código abaixo para acessar seu conteúdo:</p>
<h1 style="font-size: 32px; letter-spacing: 8px;">{{ .Token }}</h1>
<p>Este código expira em 60 minutos.</p>
```

---

## 2️⃣ Configuração da Hotmart

### Passo 1: Obter URL do Webhook

Após fazer deploy no Vercel, sua URL será:
```
https://SEU_APP.vercel.app/api/hotmart-webhook
```

### Passo 2: Configurar Postback na Hotmart

1. Acesse **Hotmart Dashboard**
2. Vá em **Produtos** > **Seu Produto** > **Configurações**
3. Clique em **Webhooks** (ou **Postback**)
4. Adicione novo webhook:
   - **URL**: `https://SEU_APP.vercel.app/api/hotmart-webhook`
   - **Version**: `v2` (mais recente)
   - **Eventos a monitorar**:
     - ✅ `PURCHASE_APPROVED`
     - ✅ `PURCHASE_COMPLETE`
     - ✅ `PURCHASE_CANCELED`
     - ✅ `PURCHASE_REFUNDED`
     - ✅ `PURCHASE_CHARGEBACK`

5. **Copie o Secret** gerado pela Hotmart (você vai usar no Vercel)

### Passo 3: Testar Webhook

1. Na Hotmart, use a ferramenta **"Testar Webhook"**
2. Verifique os logs no Vercel (Functions → hotmart-webhook → Logs)

---

## 3️⃣ Configuração do Vercel

### Passo 1: Adicionar Variáveis de Ambiente

No Vercel Dashboard > Settings > Environment Variables, adicione:

```env
# Supabase (já existentes)
VITE_SUPABASE_URL=https://dtpydjllcreeibrrtcna.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOi... (anon key)

# NOVO: Service Key (para o webhook)
SUPABASE_SERVICE_KEY=eyJhbGciOi... (service_role key - IMPORTANTE!)

# NOVO: Secret da Hotmart
HOTMART_WEBHOOK_SECRET=SEU_SECRET_AQUI
```

⚠️ **IMPORTANTE**:
- `SUPABASE_SERVICE_KEY` é a **Service Role Key**, não a Anon Key
- Encontre em Supabase Dashboard > Settings > API > service_role key
- NUNCA exponha essa key no frontend!

### Passo 2: Adicionar Dependências

Atualize `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@vercel/node": "^3.0.0",
    // ... outras dependências existentes
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    // ... outras devDependencies existentes
  }
}
```

Execute:
```bash
npm install
```

### Passo 3: Deploy

```bash
git add .
git commit -m "feat: Adicionar integração Hotmart"
git push
```

---

## 4️⃣ Integração no App

### Modificar App.tsx para usar autenticação

```tsx
import { useUserAccess } from './hooks/useUserAccess';
import LoginModal from './components/LoginModal';

function AppContent() {
  const {
    user,
    isAuthenticated,
    hasAccessToProduct,
    logout
  } = useUserAccess();

  const [showLoginModal, setShowLoginModal] = useState(false);

  // Modificar handleFullCardClick para verificar acesso
  const handleFullCardClick = async (product: Product) => {
    // Verificar se precisa de autenticação
    if (product.category === 'BONUS' && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Verificar se tem acesso ao produto
    if (product.category === 'BONUS' && !hasAccessToProduct(product.id)) {
      alert('Você não tem acesso a este conteúdo. Faça uma compra na Hotmart!');
      return;
    }

    // Código existente...
  };

  return (
    <>
      {/* Header com botão de login/logout */}
      <header>
        {/* ... */}
        {isAuthenticated ? (
          <button onClick={logout}>
            Sair ({user?.email})
          </button>
        ) : (
          <button onClick={() => setShowLoginModal(true)}>
            Fazer Login
          </button>
        )}
      </header>

      {/* Modal de Login */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />

      {/* Resto do app... */}
    </>
  );
}
```

---

## 5️⃣ Testando a Integração

### Teste 1: Webhook (Simulado)

1. Use o **Postman** ou **cURL** para simular webhook:

```bash
curl -X POST https://SEU_APP.vercel.app/api/hotmart-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PURCHASE_APPROVED",
    "data": {
      "buyer": {
        "email": "teste@example.com",
        "name": "João Silva"
      },
      "purchase": {
        "transaction": "TEST_123",
        "approved_date": "2025-01-03T12:00:00Z",
        "price": {
          "value": 97.00,
          "currency_code": "BRL"
        }
      },
      "product": {
        "id": "SEU_PRODUTO_ID",
        "name": "As Cartas de Paulo - Completo"
      }
    }
  }'
```

2. Verifique no Supabase se criou:
   - ✅ Usuário em `users`
   - ✅ Compra em `purchases`

### Teste 2: Login no App

1. Acesse seu app
2. Clique em **Fazer Login**
3. Digite `teste@example.com`
4. Verifique seu email e insira o código
5. Após login, clique em um **produto BONUS**
6. Deve abrir o PDF normalmente!

### Teste 3: Compra Real na Hotmart

1. Configure modo **Sandbox** na Hotmart
2. Faça uma compra de teste
3. Aguarde o webhook ser enviado
4. Faça login com o email usado na compra
5. Verifique se o conteúdo foi liberado

---

## ⚙️ Configurações Avançadas

### Enviar Email de Boas-Vindas

Integre com **Resend**, **SendGrid** ou **Postmark**:

```typescript
// Em api/hotmart-webhook.ts, após processar compra aprovada:

import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

if (event === 'PURCHASE_APPROVED') {
  await resend.emails.send({
    from: 'noreply@seudominio.com',
    to: email,
    subject: '🎉 Bem-vindo! Seu acesso está liberado',
    html: `
      <h1>Olá ${name}!</h1>
      <p>Seu pagamento foi confirmado e seu acesso está liberado!</p>
      <a href="${process.env.APP_URL}">Acessar Conteúdo</a>
    `
  });
}
```

### Múltiplos Produtos

Cadastre vários produtos Hotmart:

```sql
insert into hotmart_products (hotmart_product_id, product_name, unlocked_product_ids) values
('PRODUTO_BASIC_ID', 'Cartas de Paulo - Básico',
 ARRAY['letter-romanos', 'letter-1corintios', 'letter-galatas']),

('PRODUTO_COMPLETO_ID', 'Cartas de Paulo - Completo',
 ARRAY['letter-romanos', 'letter-1corintios', /* ... todos ... */]),

('PRODUTO_VIP_ID', 'Cartas de Paulo - VIP',
 ARRAY[/* todos os letters + todos os bonus + upsells */]);
```

---

## 🐛 Troubleshooting

### Problema: Webhook não está sendo recebido

**Soluções**:
1. Verifique a URL no Hotmart (deve terminar com `/api/hotmart-webhook`)
2. Teste com `curl` manualmente
3. Verifique os logs no Vercel: Functions → hotmart-webhook
4. Certifique-se que o endpoint aceita POST

### Problema: "Invalid signature"

**Soluções**:
1. Verifique se `HOTMART_WEBHOOK_SECRET` está correto no Vercel
2. Teste sem validação (comentar a verificação temporariamente)
3. Verifique se o header `x-hotmart-hottok` está sendo enviado

### Problema: Usuário não vê conteúdo após compra

**Soluções**:
1. Verifique se a compra está em `purchases` com `status = 'approved'`
2. Verifique se `hotmart_product_id` está correto na tabela `hotmart_products`
3. Verifique se `unlocked_product_ids` contém o ID correto do produto
4. Faça logout e login novamente para atualizar os dados

### Problema: "User not found" ao fazer login

**Soluções**:
1. Certifique-se que o Auth está habilitado no Supabase
2. Verifique se o email está na tabela `users`
3. Teste com o usuário de teste criado no SQL

---

## 📊 Monitoramento

### Verificar Compras Recentes

```sql
select
  u.email,
  p.product_name,
  p.status,
  p.purchase_date,
  p.created_at
from purchases p
join users u on p.user_id = u.id
order by p.created_at desc
limit 10;
```

### Ver Produtos Desbloqueados de um Usuário

```sql
select * from user_purchases_view
where email = 'cliente@example.com';
```

---

## 🎯 Próximos Passos

1. ✅ Configurar banco de dados
2. ✅ Configurar webhook na Hotmart
3. ✅ Fazer deploy no Vercel
4. ✅ Testar com compra sandbox
5. ✅ Ir para produção!

**Precisa de ajuda?** Revise os logs em:
- Vercel: Dashboard > Functions > Logs
- Supabase: Dashboard > Logs
- Hotmart: Dashboard > Webhooks > Histórico

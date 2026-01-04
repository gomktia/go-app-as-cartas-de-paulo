-- ================================================
-- SETUP: Integração Hotmart + Autenticação
-- ================================================

-- 1. Tabela de Usuários
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  created_at timestamptz default now(),
  last_login timestamptz,

  constraint email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índice para busca rápida por email
create index idx_users_email on users(email);

-- ================================================

-- 2. Tabela de Compras (Purchases)
create table if not exists purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,

  -- Dados da Hotmart
  hotmart_transaction_id text unique not null,
  product_id text not null,  -- ID do produto na Hotmart
  product_name text,

  -- Status da compra
  status text not null check (status in ('approved', 'cancelled', 'refunded', 'chargeback')),

  -- Valores
  price numeric(10,2),
  currency text default 'BRL',

  -- Datas
  purchase_date timestamptz not null,
  approved_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Dados brutos do webhook (para debug)
  raw_webhook_data jsonb
);

-- Índices
create index idx_purchases_user on purchases(user_id);
create index idx_purchases_hotmart_transaction on purchases(hotmart_transaction_id);
create index idx_purchases_status on purchases(status);

-- ================================================

-- 3. Tabela de Produtos Hotmart (mapeamento)
create table if not exists hotmart_products (
  id uuid default gen_random_uuid() primary key,
  hotmart_product_id text unique not null,
  product_name text not null,

  -- Produtos que este produto Hotmart libera no app
  unlocked_product_ids text[] default '{}',  -- IDs dos produtos no app

  -- Configuração
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exemplo de mapeamento:
-- Produto Hotmart "Cartas de Paulo Completo" (ID: 123456)
-- libera todos os produtos LETTER + BONUS no app

insert into hotmart_products (hotmart_product_id, product_name, unlocked_product_ids) values
('PRODUTO_HOTMART_ID_AQUI', 'As Cartas de Paulo - Completo',
 ARRAY['letter-romanos', 'letter-1corintios', 'letter-2corintios', 'letter-galatas',
       'letter-efesios', 'letter-filipenses', 'letter-colossenses',
       'letter-1tessalonicenses', 'letter-2tessalonicenses',
       'letter-1timoteo', 'letter-2timoteo', 'letter-tito', 'letter-filemon',
       'bonus-ansiedad', 'bonus-culpa', 'bonus-matrimonio', 'bonus-diaadia'])
on conflict (hotmart_product_id) do nothing;

-- ================================================

-- 4. View para facilitar consultas
create or replace view user_purchases_view as
select
  u.id as user_id,
  u.email,
  u.name,
  p.id as purchase_id,
  p.hotmart_transaction_id,
  p.product_name,
  p.status,
  p.purchase_date,
  hp.unlocked_product_ids
from users u
left join purchases p on u.id = p.user_id
left join hotmart_products hp on p.product_id = hp.hotmart_product_id
where p.status = 'approved';

-- ================================================

-- 5. Função para verificar acesso de um usuário a um produto
create or replace function user_has_access_to_product(
  p_user_email text,
  p_product_id text
) returns boolean as $$
declare
  has_access boolean;
begin
  select exists(
    select 1
    from users u
    join purchases p on u.id = p.user_id
    join hotmart_products hp on p.product_id = hp.hotmart_product_id
    where u.email = p_user_email
      and p.status = 'approved'
      and p_product_id = any(hp.unlocked_product_ids)
  ) into has_access;

  return has_access;
end;
$$ language plpgsql security definer;

-- ================================================

-- 6. Políticas RLS (Row Level Security)

-- Habilitar RLS
alter table users enable row level security;
alter table purchases enable row level security;

-- Usuários podem ver apenas seus próprios dados
create policy "Users can view own data"
  on users for select
  using (auth.email() = email);

-- Usuários podem ver apenas suas próprias compras
create policy "Users can view own purchases"
  on purchases for select
  using (
    user_id in (
      select id from users where email = auth.email()
    )
  );

-- ================================================

-- 7. Função para processar webhook da Hotmart
create or replace function process_hotmart_webhook(
  p_webhook_data jsonb
) returns jsonb as $$
declare
  v_user_id uuid;
  v_purchase_id uuid;
  v_email text;
  v_name text;
  v_transaction_id text;
  v_product_id text;
  v_status text;
  v_result jsonb;
begin
  -- Extrair dados do webhook Hotmart
  v_email := lower(trim(p_webhook_data->>'buyer'->>'email'));
  v_name := p_webhook_data->>'buyer'->>'name';
  v_transaction_id := p_webhook_data->>'purchase'->>'transaction';
  v_product_id := p_webhook_data->>'product'->>'id';
  v_status := case p_webhook_data->>'event'
    when 'PURCHASE_APPROVED' then 'approved'
    when 'PURCHASE_CANCELED' then 'cancelled'
    when 'PURCHASE_REFUNDED' then 'refunded'
    when 'PURCHASE_CHARGEBACK' then 'chargeback'
    else 'approved'
  end;

  -- 1. Criar ou buscar usuário
  insert into users (email, name)
  values (v_email, v_name)
  on conflict (email) do update
    set name = coalesce(excluded.name, users.name),
        last_login = now()
  returning id into v_user_id;

  -- 2. Criar ou atualizar compra
  insert into purchases (
    user_id,
    hotmart_transaction_id,
    product_id,
    product_name,
    status,
    price,
    currency,
    purchase_date,
    approved_date,
    raw_webhook_data
  )
  values (
    v_user_id,
    v_transaction_id,
    v_product_id,
    p_webhook_data->>'product'->>'name',
    v_status,
    (p_webhook_data->>'purchase'->>'price'->>'value')::numeric,
    p_webhook_data->>'purchase'->>'price'->>'currency_code',
    (p_webhook_data->>'purchase'->>'approved_date')::timestamptz,
    case when v_status = 'approved'
      then (p_webhook_data->>'purchase'->>'approved_date')::timestamptz
      else null
    end,
    p_webhook_data
  )
  on conflict (hotmart_transaction_id) do update
    set status = excluded.status,
        updated_at = now()
  returning id into v_purchase_id;

  -- 3. Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'purchase_id', v_purchase_id,
    'status', v_status
  );

  return v_result;

exception when others then
  return jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
end;
$$ language plpgsql security definer;

-- ================================================

-- 8. Criar usuário de teste (REMOVER EM PRODUÇÃO)
insert into users (email, name) values ('teste@example.com', 'Usuário Teste')
on conflict (email) do nothing;

-- Criar compra de teste
insert into purchases (
  user_id,
  hotmart_transaction_id,
  product_id,
  product_name,
  status,
  purchase_date,
  approved_date
)
select
  id,
  'TEST_TRANSACTION_123',
  'PRODUTO_HOTMART_ID_AQUI',
  'As Cartas de Paulo - Completo',
  'approved',
  now(),
  now()
from users where email = 'teste@example.com'
on conflict (hotmart_transaction_id) do nothing;

-- ================================================
-- FIM DO SETUP
-- ================================================

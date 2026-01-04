-- ================================================
-- HOTMART INTEGRATION SETUP - VERSÃO LIMPA
-- Execute este SQL no Supabase SQL Editor
-- ================================================

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ================================================

-- 2. Tabela de Compras
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Dados da Hotmart
  hotmart_transaction_id TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('approved', 'cancelled', 'refunded', 'chargeback')),

  -- Valores
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'BRL',

  -- Datas
  purchase_date TIMESTAMPTZ NOT NULL,
  approved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Dados brutos (debug)
  raw_webhook_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_hotmart_transaction ON purchases(hotmart_transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- ================================================

-- 3. Tabela de Mapeamento Hotmart → App
CREATE TABLE IF NOT EXISTS hotmart_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotmart_product_id TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,

  -- IDs dos produtos no app que este produto libera
  unlocked_product_ids INTEGER[] DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotmart_products_id ON hotmart_products(hotmart_product_id);

-- ================================================

-- 4. View para Consultas Rápidas
CREATE OR REPLACE VIEW user_purchases_view AS
SELECT
  u.id AS user_id,
  u.email,
  u.name,
  p.id AS purchase_id,
  p.hotmart_transaction_id,
  p.product_name,
  p.status,
  p.purchase_date,
  hp.unlocked_product_ids
FROM users u
LEFT JOIN purchases p ON u.id = p.user_id
LEFT JOIN hotmart_products hp ON p.product_id = hp.hotmart_product_id
WHERE p.status = 'approved';

-- ================================================

-- 5. Função para Verificar Acesso
CREATE OR REPLACE FUNCTION user_has_access_to_product(
  p_user_email TEXT,
  p_product_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM users u
    JOIN purchases p ON u.id = p.user_id
    JOIN hotmart_products hp ON p.product_id = hp.hotmart_product_id
    WHERE u.email = p_user_email
      AND p.status = 'approved'
      AND p_product_id = ANY(hp.unlocked_product_ids)
  ) INTO has_access;

  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================

-- 6. Função para Processar Webhook
CREATE OR REPLACE FUNCTION process_hotmart_webhook(
  p_webhook_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_purchase_id UUID;
  v_email TEXT;
  v_name TEXT;
  v_transaction_id TEXT;
  v_product_id TEXT;
  v_status TEXT;
  v_result JSONB;
BEGIN
  -- Extrair dados do webhook
  v_email := LOWER(TRIM(p_webhook_data->'data'->'buyer'->>'email'));
  v_name := p_webhook_data->'data'->'buyer'->>'name';
  v_transaction_id := p_webhook_data->'data'->'purchase'->>'transaction';
  v_product_id := p_webhook_data->'data'->'product'->>'id';

  -- Determinar status
  v_status := CASE p_webhook_data->>'event'
    WHEN 'PURCHASE_APPROVED' THEN 'approved'
    WHEN 'PURCHASE_COMPLETE' THEN 'approved'
    WHEN 'PURCHASE_CANCELED' THEN 'cancelled'
    WHEN 'PURCHASE_REFUNDED' THEN 'refunded'
    WHEN 'PURCHASE_CHARGEBACK' THEN 'chargeback'
    ELSE 'approved'
  END;

  -- Criar ou atualizar usuário
  INSERT INTO users (email, name)
  VALUES (v_email, v_name)
  ON CONFLICT (email) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, users.name),
        last_login = now()
  RETURNING id INTO v_user_id;

  -- Criar ou atualizar compra
  INSERT INTO purchases (
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
  VALUES (
    v_user_id,
    v_transaction_id,
    v_product_id,
    p_webhook_data->'data'->'product'->>'name',
    v_status,
    (p_webhook_data->'data'->'purchase'->'price'->>'value')::NUMERIC,
    p_webhook_data->'data'->'purchase'->'price'->>'currency_code',
    (p_webhook_data->'data'->'purchase'->>'approved_date')::TIMESTAMPTZ,
    CASE WHEN v_status = 'approved'
      THEN (p_webhook_data->'data'->'purchase'->>'approved_date')::TIMESTAMPTZ
      ELSE NULL
    END,
    p_webhook_data
  )
  ON CONFLICT (hotmart_transaction_id) DO UPDATE
    SET status = EXCLUDED.status,
        updated_at = now()
  RETURNING id INTO v_purchase_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'purchase_id', v_purchase_id,
    'status', v_status
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotmart_products ENABLE ROW LEVEL SECURITY;

-- Políticas: Público pode ler hotmart_products
DROP POLICY IF EXISTS "Public read hotmart_products" ON hotmart_products;
CREATE POLICY "Public read hotmart_products"
  ON hotmart_products FOR SELECT
  USING (true);

-- Políticas: Usuários veem apenas seus dados
DROP POLICY IF EXISTS "Users view own data" ON users;
CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.email() = email);

DROP POLICY IF EXISTS "Users view own purchases" ON purchases;
CREATE POLICY "Users view own purchases"
  ON purchases FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE email = auth.email()));

-- ================================================

-- 8. Criar Usuário de Teste
INSERT INTO users (email, name)
VALUES ('teste@example.com', 'Usuário Teste')
ON CONFLICT (email) DO NOTHING;

-- ================================================
-- ✅ SETUP COMPLETO!
-- ================================================

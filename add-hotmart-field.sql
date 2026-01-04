-- Adicionar campo para Código do Produto Hotmart
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS hotmart_product_code TEXT;

-- Criar índice para busca rápida por código Hotmart
CREATE INDEX IF NOT EXISTS idx_products_hotmart_code
ON products(hotmart_product_code);

-- Comentário explicativo
COMMENT ON COLUMN products.hotmart_product_code IS 'Código do produto na Hotmart para validação de acesso';

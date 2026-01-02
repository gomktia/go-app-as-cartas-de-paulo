-- SOLUÇÃO: Recriar a tabela chapters com id como TEXT

-- 1. Backup dos dados existentes (se houver)
CREATE TEMP TABLE chapters_backup AS
SELECT * FROM chapters;

-- 2. Dropar a tabela antiga
DROP TABLE IF EXISTS chapters CASCADE;

-- 3. Criar nova tabela com schema correto
CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  pdf_url TEXT,
  audio_url TEXT,
  language VARCHAR(5) DEFAULT 'pt',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Restaurar dados do backup (se houver)
-- Nota: Como estamos mudando o tipo do id, vamos pular essa etapa
-- pois os dados antigos tinham IDs numéricos que não servem mais

-- 5. Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- 6. Criar policies
DROP POLICY IF EXISTS "Public Read Access for Chapters" ON chapters;
CREATE POLICY "Public Read Access for Chapters"
ON chapters FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public Write Access for Chapters" ON chapters;
CREATE POLICY "Public Write Access for Chapters"
ON chapters FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Criar índice
CREATE INDEX idx_chapters_product_language
ON chapters(product_id, language);

-- Sucesso!
SELECT 'Tabela chapters recriada com sucesso! Execute: node sync-chapters.mjs' AS message;

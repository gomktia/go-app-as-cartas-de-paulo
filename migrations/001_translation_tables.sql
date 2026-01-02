-- Migration: Multi-Language Translation Support
-- Created: 2024-12-18
-- Description: Creates tables for caching translations and translated PDFs

-- ============================================
-- Table: translations
-- Purpose: Store translated content for products and chapters
-- ============================================

CREATE TABLE IF NOT EXISTS translations (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,     -- 'product' | 'chapter'
  entity_id TEXT NOT NULL,              -- ID do produto/capítulo
  field_name VARCHAR(100) NOT NULL,     -- 'title' | 'subtitle' | 'description'
  language VARCHAR(5) NOT NULL,         -- 'pt' | 'es' | 'en' | 'fr'
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Composite unique constraint: one translation per entity/field/language
  UNIQUE(entity_type, entity_id, field_name, language)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_translations_lookup
ON translations(entity_type, entity_id, language);

-- Index for language-specific queries
CREATE INDEX IF NOT EXISTS idx_translations_language
ON translations(language);

-- ============================================
-- Table: translated_pdfs
-- Purpose: Cache translated PDF content
-- ============================================

CREATE TABLE IF NOT EXISTS translated_pdfs (
  id BIGSERIAL PRIMARY KEY,
  original_pdf_url TEXT NOT NULL,
  language VARCHAR(5) NOT NULL,         -- 'pt' | 'es' | 'en' | 'fr'
  translated_content TEXT,              -- Conteúdo traduzido (texto ou base64)
  storage_url TEXT,                     -- URL no Supabase Storage (se PDF foi gerado)
  page_count INT,
  translation_status VARCHAR(20) DEFAULT 'completed', -- 'pending' | 'processing' | 'completed' | 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                 -- Para cache expiration (opcional)

  -- One translation per PDF/language combination
  UNIQUE(original_pdf_url, language)
);

-- Index for faster PDF lookups
CREATE INDEX IF NOT EXISTS idx_translated_pdfs_lookup
ON translated_pdfs(original_pdf_url, language);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_translated_pdfs_status
ON translated_pdfs(translation_status);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on both tables
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translated_pdfs ENABLE ROW LEVEL SECURITY;

-- Public Read Access for translations
CREATE POLICY IF NOT EXISTS "Public Read Translations"
ON translations FOR SELECT
USING (true);

-- Public Write Access for translations (app can cache translations)
CREATE POLICY IF NOT EXISTS "Public Write Translations"
ON translations FOR ALL
USING (true);

-- Public Read Access for translated PDFs
CREATE POLICY IF NOT EXISTS "Public Read PDF Translations"
ON translated_pdfs FOR SELECT
USING (true);

-- Public Write Access for translated PDFs
CREATE POLICY IF NOT EXISTS "Public Write PDF Translations"
ON translated_pdfs FOR ALL
USING (true);

-- ============================================
-- Helper Function: Update timestamp automatically
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for translations table
DROP TRIGGER IF EXISTS update_translations_updated_at ON translations;
CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON translations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for translated_pdfs table
DROP TRIGGER IF EXISTS update_translated_pdfs_updated_at ON translated_pdfs;
CREATE TRIGGER update_translated_pdfs_updated_at
BEFORE UPDATE ON translated_pdfs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Queries
-- ============================================

-- Check if tables were created successfully
SELECT
    'translations' as table_name,
    COUNT(*) as row_count
FROM translations
UNION ALL
SELECT
    'translated_pdfs' as table_name,
    COUNT(*) as row_count
FROM translated_pdfs;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📋 Tables created: translations, translated_pdfs';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '⚡ Indexes created for performance';
    RAISE NOTICE '🚀 Multi-language system ready!';
END $$;

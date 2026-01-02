-- =====================================================
-- Migration 002: Configure Supabase Storage for PDFs
-- =====================================================
-- Description: Creates storage bucket for PDF files and translated versions
-- Date: 2025-12-18

-- 1. Create Storage Bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for PDFs Bucket

-- Allow public read access to all PDFs
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

-- Allow public upload (you can restrict this to authenticated users if needed)
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs');

-- Allow public update (for overwriting PDFs)
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
CREATE POLICY "Public Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pdfs');

-- Allow public delete (you can restrict this to authenticated users if needed)
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs');

-- =====================================================
-- Storage Structure:
-- =====================================================
-- /pdfs/
--   ├── originals/
--   │   ├── romanos.pdf
--   │   ├── 1-corintios.pdf
--   │   └── ...
--   └── translated/
--       ├── romanos-es.pdf
--       ├── romanos-en.pdf
--       ├── romanos-fr.pdf
--       ├── 1-corintios-es.pdf
--       └── ...
-- =====================================================

-- 3. Update translated_pdfs table to include storage_path
ALTER TABLE translated_pdfs
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_translated_pdfs_storage_path
ON translated_pdfs(storage_path);

-- =====================================================
-- Instructions:
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- After running, you can upload PDFs via:
-- 1. Supabase Dashboard → Storage → pdfs bucket
-- 2. Or via the Admin Panel in the app (after implementation)
-- =====================================================

-- =====================================================
-- Storage Policies for PDFs Bucket
-- =====================================================
-- This allows the app to upload, read, update and delete PDFs
-- =====================================================

-- 1. Allow public SELECT (read) access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

-- 2. Allow public INSERT (upload) access
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs');

-- 3. Allow public UPDATE (for upsert) access
CREATE POLICY "Public Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pdfs')
WITH CHECK (bucket_id = 'pdfs');

-- 4. Allow public DELETE access (optional, for cleanup)
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs');

-- Verify policies were created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%pdfs%';

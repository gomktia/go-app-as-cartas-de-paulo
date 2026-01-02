-- =====================================================
-- RLS Policies for Products Table
-- =====================================================
-- Allow public read access to products
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT (read) access
CREATE POLICY "Public Read Access for Products"
ON products FOR SELECT
USING (true);

-- Verify policy was created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'products';

-- Create chapters table if it doesn't exist
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  pdf_url TEXT,
  audio_url TEXT,
  language VARCHAR(5) DEFAULT 'pt',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Convert id column to TEXT if it's currently a number type
DO $$
BEGIN
  -- Check if id column is not already TEXT
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'chapters'
    AND column_name = 'id'
    AND data_type IN ('bigint', 'integer', 'smallint')
  ) THEN
    -- Drop the primary key constraint first
    ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_pkey;
    -- Change column type to TEXT
    ALTER TABLE chapters ALTER COLUMN id TYPE TEXT;
    -- Re-add primary key
    ALTER TABLE chapters ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Add language column if table already exists but column doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'chapters'
    AND column_name = 'language'
  ) THEN
    ALTER TABLE chapters ADD COLUMN language VARCHAR(5) DEFAULT 'pt';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Public Read Access for Chapters" ON chapters;
CREATE POLICY "Public Read Access for Chapters"
ON chapters FOR SELECT
USING (true);

-- Allow public insert/update for the sync script
DROP POLICY IF EXISTS "Public Write Access for Chapters" ON chapters;
CREATE POLICY "Public Write Access for Chapters"
ON chapters FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chapters_product_language
ON chapters(product_id, language);

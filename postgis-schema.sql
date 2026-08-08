CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS location geography(Point, 4326),
ADD COLUMN IF NOT EXISTS lat numeric,
ADD COLUMN IF NOT EXISTS lng numeric,
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '{}'::jsonb;

-- Safely create indices (PostgreSQL IF NOT EXISTS for index requires pg_class check, 
-- but we can just drop them safely then create)
DROP INDEX IF EXISTS idx_facilities_location;
CREATE INDEX idx_facilities_location ON facilities USING GIST(location);

DROP INDEX IF EXISTS idx_facilities_tags;
CREATE INDEX idx_facilities_tags ON facilities USING GIN(tags);

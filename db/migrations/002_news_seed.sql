-- Nothing to create; this exists so the news table has a home for future
-- schema changes and to prove the migration runner applies more than one file.
-- Intentionally a no-op beyond a comment column nobody has needed yet.
ALTER TABLE news ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin';
COMMENT ON COLUMN news.source IS 'Where the row came from: admin, import, or seed.';

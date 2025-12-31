-- Create items_v2 table with image as JSON column
-- DSQL doesn't support ALTER TABLE DROP COLUMN, so we create a new table

CREATE TABLE items_v2 (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  shelf VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  rating INTEGER,
  image TEXT,  -- JSON string with full structure including sizes array
  external_id VARCHAR(255),
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  series_id UUID,
  data TEXT DEFAULT '{}',
  CONSTRAINT chk_series_id_v2 CHECK (series_id IS NULL OR type = 'TvSeason')
);

-- Essential indexes (5 total)
-- DSQL requires CREATE INDEX ASYNC for all index creation
CREATE INDEX ASYNC idx_type_moved_v2 ON items_v2 (type, moved_at);
CREATE INDEX ASYNC idx_type_shelf_moved_v2 ON items_v2 (type, shelf, moved_at);
CREATE INDEX ASYNC idx_type_title_v2 ON items_v2 (type, title);
CREATE INDEX ASYNC idx_external_id_v2 ON items_v2 (external_id);
CREATE INDEX ASYNC idx_series_id_v2 ON items_v2 (series_id, moved_at);

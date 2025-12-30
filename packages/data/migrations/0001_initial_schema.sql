-- Initial schema for Billio items table
-- DSQL-compatible: no USING btree, no WHERE clause on indexes, no DESC

CREATE TABLE items (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  shelf VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  rating INTEGER,
  image_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  external_id VARCHAR(255),
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  series_id UUID,
  data TEXT DEFAULT '{}',
  CONSTRAINT chk_series_id CHECK (series_id IS NULL OR type = 'TvSeason')
);

-- Essential indexes (5 total)
-- DSQL requires CREATE INDEX ASYNC for all index creation
CREATE INDEX ASYNC idx_type_moved ON items (type, moved_at);
CREATE INDEX ASYNC idx_type_shelf_moved ON items (type, shelf, moved_at);
CREATE INDEX ASYNC idx_type_title ON items (type, title);
CREATE INDEX ASYNC idx_external_id ON items (external_id);
CREATE INDEX ASYNC idx_series_id ON items (series_id, moved_at);

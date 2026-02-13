CREATE TABLE IF NOT EXISTS post_views (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,
  views      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(slug)
);

CREATE INDEX IF NOT EXISTS idx_post_views_views ON post_views(views DESC);
CREATE INDEX IF NOT EXISTS idx_post_views_updated ON post_views(updated_at DESC);

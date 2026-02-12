-- 文章表
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('tech','learning','journal','life')),
  tags TEXT DEFAULT '[]',
  cover TEXT,
  draft INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_category_draft ON posts(category, draft, created_at DESC);
CREATE INDEX idx_posts_updated_at ON posts(updated_at DESC);

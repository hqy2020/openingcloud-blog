-- Extend timeline_nodes type enum to include reflection.
PRAGMA foreign_keys = off;

CREATE TABLE IF NOT EXISTS timeline_nodes_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  start_date  TEXT NOT NULL,
  end_date    TEXT,
  type        TEXT NOT NULL CHECK(type IN ('career','health','learning','family','reflection')),
  impact      TEXT DEFAULT 'medium' CHECK(impact IN ('high','medium','low')),
  phase       TEXT,
  tags        TEXT DEFAULT '[]',
  cover       TEXT,
  links       TEXT DEFAULT '[]',
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

INSERT INTO timeline_nodes_new (id, title, description, start_date, end_date, type, impact, phase, tags, cover, links, sort_order, created_at, updated_at)
SELECT id, title, description, start_date, end_date, type, impact, phase, tags, cover, links, sort_order, created_at, updated_at
FROM timeline_nodes;

DROP TABLE timeline_nodes;
ALTER TABLE timeline_nodes_new RENAME TO timeline_nodes;

CREATE INDEX IF NOT EXISTS idx_timeline_start ON timeline_nodes(start_date);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_nodes(type);
CREATE INDEX IF NOT EXISTS idx_timeline_phase ON timeline_nodes(phase);

PRAGMA foreign_keys = on;

CREATE TABLE IF NOT EXISTS travel_places (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  province   TEXT NOT NULL,
  city       TEXT NOT NULL,
  period     TEXT NOT NULL,
  tag        TEXT NOT NULL CHECK(tag IN ('求学','工作','旅行','生活')),
  is_current INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_travel_province ON travel_places(province);
CREATE INDEX IF NOT EXISTS idx_travel_sort ON travel_places(sort_order);

CREATE TABLE IF NOT EXISTS social_friends (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_id     TEXT NOT NULL,
  name         TEXT NOT NULL,
  public_label TEXT NOT NULL,
  bio          TEXT,
  avatar       TEXT,
  link         TEXT,
  platform     TEXT DEFAULT 'other',
  sort_order   INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_social_stage ON social_friends(stage_id);

CREATE TABLE IF NOT EXISTS highlight_stages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT NOT NULL,
  period     TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS highlight_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_id   INTEGER NOT NULL REFERENCES highlight_stages(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_highlight_items_stage ON highlight_items(stage_id, sort_order);

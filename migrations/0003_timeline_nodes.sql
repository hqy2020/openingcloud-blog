-- timeline_nodes: 人生路线时间线节点
CREATE TABLE timeline_nodes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  start_date  TEXT NOT NULL,
  end_date    TEXT,
  type        TEXT NOT NULL CHECK(type IN ('career','health','learning','family')),
  impact      TEXT DEFAULT 'medium' CHECK(impact IN ('high','medium','low')),
  phase       TEXT,
  tags        TEXT DEFAULT '[]',
  cover       TEXT,
  links       TEXT DEFAULT '[]',
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_timeline_start ON timeline_nodes(start_date);
CREATE INDEX idx_timeline_type ON timeline_nodes(type);
CREATE INDEX idx_timeline_phase ON timeline_nodes(phase);

-- diary_entries: 日记数据（步数/睡眠/专注/运动/心情）
CREATE TABLE diary_entries (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  date             TEXT NOT NULL UNIQUE,
  steps            INTEGER,
  sleep_hours      REAL,
  focus_hours      REAL,
  exercise_minutes INTEGER,
  mood             INTEGER CHECK(mood BETWEEN 1 AND 5),
  note             TEXT,
  tags             TEXT DEFAULT '[]',
  created_at       TEXT DEFAULT (datetime('now')),
  updated_at       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_diary_date ON diary_entries(date DESC);

type DB = import('@cloudflare/workers-types').D1Database;

export interface DiaryEntry {
  id: number;
  date: string;
  steps: number | null;
  sleep_hours: number | null;
  focus_hours: number | null;
  exercise_minutes: number | null;
  mood: number | null;
  note: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface DiaryFilters {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function getDiaryEntries(db: DB, filters: DiaryFilters = {}) {
  const { from, to, page = 1, pageSize = 30 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (from) { conditions.push('date >= ?'); params.push(from); }
  if (to) { conditions.push('date <= ?'); params.push(to); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM diary_entries ${where}`)
    .bind(...params)
    .first<{ total: number }>();

  const rows = await db
    .prepare(`SELECT * FROM diary_entries ${where} ORDER BY date DESC LIMIT ? OFFSET ?`)
    .bind(...params, pageSize, offset)
    .all<DiaryEntry>();

  return { entries: rows.results, total: countResult?.total ?? 0, page, pageSize };
}

export async function getDiaryEntry(db: DB, id: number) {
  return db.prepare('SELECT * FROM diary_entries WHERE id = ?').bind(id).first<DiaryEntry>();
}

export async function getDiaryByDate(db: DB, date: string) {
  return db.prepare('SELECT * FROM diary_entries WHERE date = ?').bind(date).first<DiaryEntry>();
}

export async function createDiaryEntry(db: DB, data: {
  date: string;
  steps?: number;
  sleep_hours?: number;
  focus_hours?: number;
  exercise_minutes?: number;
  mood?: number;
  note?: string;
  tags?: string[];
}) {
  const result = await db
    .prepare('INSERT INTO diary_entries (date, steps, sleep_hours, focus_hours, exercise_minutes, mood, note, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(data.date, data.steps ?? null, data.sleep_hours ?? null, data.focus_hours ?? null, data.exercise_minutes ?? null, data.mood ?? null, data.note ?? null, JSON.stringify(data.tags ?? []))
    .run();
  return { id: result.meta.last_row_id };
}

export async function updateDiaryEntry(db: DB, id: number, data: {
  date?: string;
  steps?: number | null;
  sleep_hours?: number | null;
  focus_hours?: number | null;
  exercise_minutes?: number | null;
  mood?: number | null;
  note?: string | null;
  tags?: string[];
}) {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.date !== undefined) { fields.push('date = ?'); params.push(data.date); }
  if (data.steps !== undefined) { fields.push('steps = ?'); params.push(data.steps); }
  if (data.sleep_hours !== undefined) { fields.push('sleep_hours = ?'); params.push(data.sleep_hours); }
  if (data.focus_hours !== undefined) { fields.push('focus_hours = ?'); params.push(data.focus_hours); }
  if (data.exercise_minutes !== undefined) { fields.push('exercise_minutes = ?'); params.push(data.exercise_minutes); }
  if (data.mood !== undefined) { fields.push('mood = ?'); params.push(data.mood); }
  if (data.note !== undefined) { fields.push('note = ?'); params.push(data.note); }
  if (data.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(data.tags)); }

  if (fields.length === 0) return { changes: 0 };

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const result = await db.prepare(`UPDATE diary_entries SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run();
  return { changes: result.meta.changes };
}

export async function deleteDiaryEntry(db: DB, id: number) {
  const result = await db.prepare('DELETE FROM diary_entries WHERE id = ?').bind(id).run();
  return { changes: result.meta.changes };
}

export async function getDiaryStats(db: DB, from?: string, to?: string) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (from) { conditions.push('date >= ?'); params.push(from); }
  if (to) { conditions.push('date <= ?'); params.push(to); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const stats = await db
    .prepare(`SELECT COUNT(*) as count, AVG(steps) as avg_steps, AVG(sleep_hours) as avg_sleep, AVG(focus_hours) as avg_focus, AVG(exercise_minutes) as avg_exercise, AVG(mood) as avg_mood FROM diary_entries ${where}`)
    .bind(...params)
    .first<Record<string, number>>();

  return stats;
}

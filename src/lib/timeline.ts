type DB = import('@cloudflare/workers-types').D1Database;

export interface TimelineNode {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  type: 'career' | 'health' | 'learning' | 'family' | 'reflection';
  impact: 'high' | 'medium' | 'low';
  phase: string | null;
  tags: string;
  cover: string | null;
  links: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TimelineFilters {
  type?: string;
  phase?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function getTimelineNodes(db: DB, filters: TimelineFilters = {}) {
  const { type, phase, from, to, page = 1, pageSize = 50 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (type) { conditions.push('type = ?'); params.push(type); }
  if (phase) { conditions.push('phase = ?'); params.push(phase); }
  if (from) { conditions.push('start_date >= ?'); params.push(from); }
  if (to) { conditions.push('start_date <= ?'); params.push(to); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM timeline_nodes ${where}`)
    .bind(...params)
    .first<{ total: number }>();

  const rows = await db
    .prepare(`SELECT * FROM timeline_nodes ${where} ORDER BY start_date DESC, sort_order ASC LIMIT ? OFFSET ?`)
    .bind(...params, pageSize, offset)
    .all<TimelineNode>();

  return { nodes: rows.results, total: countResult?.total ?? 0, page, pageSize };
}

export async function getTimelineNode(db: DB, id: number) {
  return db.prepare('SELECT * FROM timeline_nodes WHERE id = ?').bind(id).first<TimelineNode>();
}

export async function createTimelineNode(db: DB, data: {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  type: string;
  impact?: string;
  phase?: string;
  tags?: string[];
  cover?: string;
  links?: string[];
}) {
  const result = await db
    .prepare('INSERT INTO timeline_nodes (title, description, start_date, end_date, type, impact, phase, tags, cover, links) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(data.title, data.description ?? null, data.start_date, data.end_date ?? null, data.type, data.impact ?? 'medium', data.phase ?? null, JSON.stringify(data.tags ?? []), data.cover ?? null, JSON.stringify(data.links ?? []))
    .run();
  return { id: result.meta.last_row_id };
}

export async function updateTimelineNode(db: DB, id: number, data: {
  title?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string | null;
  type?: string;
  impact?: string;
  phase?: string | null;
  tags?: string[];
  cover?: string | null;
  links?: string[];
  sort_order?: number;
}) {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.start_date !== undefined) { fields.push('start_date = ?'); params.push(data.start_date); }
  if (data.end_date !== undefined) { fields.push('end_date = ?'); params.push(data.end_date); }
  if (data.type !== undefined) { fields.push('type = ?'); params.push(data.type); }
  if (data.impact !== undefined) { fields.push('impact = ?'); params.push(data.impact); }
  if (data.phase !== undefined) { fields.push('phase = ?'); params.push(data.phase); }
  if (data.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(data.tags)); }
  if (data.cover !== undefined) { fields.push('cover = ?'); params.push(data.cover); }
  if (data.links !== undefined) { fields.push('links = ?'); params.push(JSON.stringify(data.links)); }
  if (data.sort_order !== undefined) { fields.push('sort_order = ?'); params.push(data.sort_order); }

  if (fields.length === 0) return { changes: 0 };

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const result = await db.prepare(`UPDATE timeline_nodes SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run();
  return { changes: result.meta.changes };
}

export async function deleteTimelineNode(db: DB, id: number) {
  const result = await db.prepare('DELETE FROM timeline_nodes WHERE id = ?').bind(id).run();
  return { changes: result.meta.changes };
}

export async function reorderTimelineNodes(db: DB, orders: { id: number; sort_order: number }[]) {
  let changes = 0;
  for (const { id, sort_order } of orders) {
    const r = await db.prepare("UPDATE timeline_nodes SET sort_order = ?, updated_at = datetime('now') WHERE id = ?").bind(sort_order, id).run();
    changes += r.meta.changes;
  }
  return { changes };
}

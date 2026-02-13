type DB = import('@cloudflare/workers-types').D1Database;

export interface TravelPlace {
  id: number;
  province: string;
  city: string;
  period: string;
  tag: '求学' | '工作' | '旅行' | '生活';
  is_current: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TravelFilters {
  province?: string;
  page?: number;
  pageSize?: number;
}

export async function getTravelPlaces(db: DB, filters: TravelFilters = {}) {
  const { province, page = 1, pageSize = 100 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (province) {
    conditions.push('province = ?');
    params.push(province);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM travel_places ${where}`)
    .bind(...params)
    .first<{ total: number }>();

  const rows = await db
    .prepare(`SELECT * FROM travel_places ${where} ORDER BY province ASC, sort_order ASC, id ASC LIMIT ? OFFSET ?`)
    .bind(...params, pageSize, offset)
    .all<TravelPlace>();

  return {
    places: rows.results,
    total: countResult?.total ?? 0,
    page,
    pageSize,
  };
}

export async function getTravelPlace(db: DB, id: number) {
  return db.prepare('SELECT * FROM travel_places WHERE id = ?').bind(id).first<TravelPlace>();
}

export async function createTravelPlace(
  db: DB,
  data: {
    province: string;
    city: string;
    period: string;
    tag: '求学' | '工作' | '旅行' | '生活';
    is_current?: number;
    sort_order?: number;
  }
) {
  const result = await db
    .prepare('INSERT INTO travel_places (province, city, period, tag, is_current, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(data.province, data.city, data.period, data.tag, data.is_current ?? 0, data.sort_order ?? 0)
    .run();

  return { id: result.meta.last_row_id };
}

export async function updateTravelPlace(
  db: DB,
  id: number,
  data: {
    province?: string;
    city?: string;
    period?: string;
    tag?: '求学' | '工作' | '旅行' | '生活';
    is_current?: number;
    sort_order?: number;
  }
) {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.province !== undefined) {
    fields.push('province = ?');
    params.push(data.province);
  }
  if (data.city !== undefined) {
    fields.push('city = ?');
    params.push(data.city);
  }
  if (data.period !== undefined) {
    fields.push('period = ?');
    params.push(data.period);
  }
  if (data.tag !== undefined) {
    fields.push('tag = ?');
    params.push(data.tag);
  }
  if (data.is_current !== undefined) {
    fields.push('is_current = ?');
    params.push(data.is_current);
  }
  if (data.sort_order !== undefined) {
    fields.push('sort_order = ?');
    params.push(data.sort_order);
  }

  if (fields.length === 0) return { changes: 0 };

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const result = await db
    .prepare(`UPDATE travel_places SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  return { changes: result.meta.changes };
}

export async function deleteTravelPlace(db: DB, id: number) {
  const result = await db.prepare('DELETE FROM travel_places WHERE id = ?').bind(id).run();
  return { changes: result.meta.changes };
}

export async function getTravelGrouped(db: DB) {
  const rows = await db
    .prepare('SELECT province, city, period, tag, is_current FROM travel_places ORDER BY province ASC, sort_order ASC, id ASC')
    .all<Pick<TravelPlace, 'province' | 'city' | 'period' | 'tag' | 'is_current'>>();

  const grouped = new Map<string, Array<{ name: string; period: string; tag: TravelPlace['tag']; current: boolean }>>();

  rows.results.forEach((row) => {
    const bucket = grouped.get(row.province) || [];
    bucket.push({
      name: row.city,
      period: row.period,
      tag: row.tag,
      current: !!row.is_current,
    });
    grouped.set(row.province, bucket);
  });

  return [...grouped.entries()].map(([province, cities]) => ({ province, cities }));
}
